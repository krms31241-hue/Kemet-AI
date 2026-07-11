/**
 * command-executor.ts
 *
 * Runs a command as a child process (`node:child_process.spawn`, never a
 * shell — `shell: false` always) with two safety nets a raw `spawn` call
 * doesn't give you: a hard timeout (SIGTERM, then SIGKILL after a grace
 * period if it won't die) and a maximum combined output size, so a
 * runaway or malicious command can't hang a request or exhaust memory
 * buffering output.
 *
 * On timeout, the promise *resolves* (not rejects) with `timedOut: true`
 * and whatever stdout/stderr had been captured so far — callers usually
 * want the partial output for diagnostics, not just a bare error.
 */

import { spawn } from "node:child_process";

import { normalizeTerminalError, TerminalError, TerminalErrorCode } from "./terminal-error.js";
import type { TerminalCommand, TerminalExecuteOptions, TerminalOutputStream, TerminalResult } from "./terminal.types.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_OUTPUT_BYTES = 5 * 1024 * 1024;
const KILL_GRACE_MS = 2_000;

export class CommandExecutor {
  private readonly defaultTimeoutMs: number;
  private readonly defaultMaxOutputBytes: number;

  constructor(defaultTimeoutMs: number = DEFAULT_TIMEOUT_MS, defaultMaxOutputBytes: number = DEFAULT_MAX_OUTPUT_BYTES) {
    this.defaultTimeoutMs = defaultTimeoutMs;
    this.defaultMaxOutputBytes = defaultMaxOutputBytes;
  }

  public execute(command: TerminalCommand, options: TerminalExecuteOptions = {}): Promise<TerminalResult> {
    const args = command.args ? [...command.args] : [];
    const timeoutMs = command.timeoutMs ?? this.defaultTimeoutMs;
    const maxOutputBytes = options.maxOutputBytes ?? this.defaultMaxOutputBytes;
    const startedAt = Date.now();

    return new Promise<TerminalResult>((resolve, reject) => {
      const child = spawn(command.command, args, {
        cwd: command.cwd,
        env: { ...process.env, ...command.env },
        shell: false,
      });

      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];
      let outputBytes = 0;
      let timedOut = false;
      let settled = false;
      let killTimer: NodeJS.Timeout | undefined;

      const timeoutTimer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        killTimer = setTimeout(() => {
          if (child.exitCode === null && child.signalCode === null) {
            child.kill("SIGKILL");
          }
        }, KILL_GRACE_MS);
      }, timeoutMs);

      const settleReject = (error: unknown): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        if (killTimer) clearTimeout(killTimer);
        reject(error);
      };

      const handleChunk = (stream: TerminalOutputStream, chunk: Buffer): void => {
        const text = chunk.toString("utf8");
        outputBytes += Buffer.byteLength(text, "utf8");
        (stream === "stdout" ? stdoutChunks : stderrChunks).push(text);
        options.onOutput?.({ stream, data: text });

        if (outputBytes > maxOutputBytes) {
          child.kill("SIGKILL");
          settleReject(
            new TerminalError({
              code: TerminalErrorCode.OUTPUT_LIMIT_EXCEEDED,
              message: `Command "${command.command}" exceeded the maximum output size of ${maxOutputBytes} bytes`,
              context: { command: command.command, cwd: command.cwd },
            }),
          );
        }
      };

      child.stdout?.on("data", (chunk: Buffer) => handleChunk("stdout", chunk));
      child.stderr?.on("data", (chunk: Buffer) => handleChunk("stderr", chunk));

      if (command.input !== undefined) {
        child.stdin?.write(command.input);
      }
      child.stdin?.end();

      child.on("error", (error) => {
        settleReject(normalizeTerminalError(error, { command: command.command, cwd: command.cwd }));
      });

      child.on("close", (exitCode, signal) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutTimer);
        if (killTimer) clearTimeout(killTimer);

        resolve({
          command: command.command,
          args,
          stdout: stdoutChunks.join(""),
          stderr: stderrChunks.join(""),
          exitCode,
          signal,
          durationMs: Date.now() - startedAt,
          timedOut,
        });
      });
    });
  }
}

export const commandExecutor = new CommandExecutor();

