/**
 * terminal.types.ts
 *
 * Types for executing shell commands as child processes. This module is
 * a low-level primitive: it operates on an already-resolved absolute
 * `cwd` and does not itself understand "workspaces" — path containment
 * (keeping a command's cwd inside a workspace root) is the responsibility
 * of the caller (the future `workspace` subsystem), reusing
 * `filesystem`'s `resolveWithinRoot` for that check.
 */

export interface TerminalCommand {
  readonly command: string;
  readonly args?: readonly string[];
  /** Absolute working directory. Callers are responsible for validating this stays within an intended root. */
  readonly cwd: string;
  readonly env?: Readonly<Record<string, string>>;
  /** Text piped to the process's stdin, if any. */
  readonly input?: string;
  /** Milliseconds before the process is forcibly terminated. Default 30_000. */
  readonly timeoutMs?: number;
}

export type TerminalOutputStream = "stdout" | "stderr";

export interface TerminalOutputChunk {
  readonly stream: TerminalOutputStream;
  readonly data: string;
}

export type TerminalOutputListener = (chunk: TerminalOutputChunk) => void;

export interface TerminalExecuteOptions {
  /** Invoked synchronously for every chunk of output as it arrives, in addition to the buffered result. */
  readonly onOutput?: TerminalOutputListener;
  /** Maximum combined stdout+stderr bytes retained before the process is killed. Default 5 MiB. */
  readonly maxOutputBytes?: number;
}

export interface TerminalResult {
  readonly command: string;
  readonly args: readonly string[];
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly durationMs: number;
  readonly timedOut: boolean;
}

