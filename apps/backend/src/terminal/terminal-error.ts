/**
 * terminal-error.ts
 *
 * Normalized error type for the terminal execution domain. Same
 * funnel/shape pattern as `ProviderError`, `ToolError`, and
 * `FileSystemError` elsewhere in this codebase.
 */

export enum TerminalErrorCode {
  COMMAND_NOT_FOUND = "COMMAND_NOT_FOUND",
  TIMEOUT = "TIMEOUT",
  OUTPUT_LIMIT_EXCEEDED = "OUTPUT_LIMIT_EXCEEDED",
  EXECUTION_FAILED = "EXECUTION_FAILED",
  UNKNOWN = "UNKNOWN",
}

export interface TerminalErrorContext {
  readonly command?: string;
  readonly cwd?: string;
  readonly [key: string]: unknown;
}

export interface TerminalErrorOptions {
  readonly code: TerminalErrorCode;
  readonly message: string;
  readonly context?: TerminalErrorContext;
  readonly cause?: unknown;
}

export class TerminalError extends Error {
  public readonly code: TerminalErrorCode;
  public readonly context: TerminalErrorContext;
  public override readonly cause?: unknown;
  public readonly timestamp: string;

  constructor(options: TerminalErrorOptions) {
    super(options.message);
    this.name = "TerminalError";
    this.code = options.code;
    this.context = options.context ?? {};
    this.cause = options.cause;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, TerminalError.prototype);
  }

  public toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  public static isTerminalError(value: unknown): value is TerminalError {
    return value instanceof TerminalError;
  }
}

export function normalizeTerminalError(error: unknown, context?: TerminalErrorContext): TerminalError {
  if (TerminalError.isTerminalError(error)) {
    return context
      ? new TerminalError({ code: error.code, message: error.message, cause: error.cause, context: { ...error.context, ...context } })
      : error;
  }

  const errno = error as NodeJS.ErrnoException | undefined;
  if (errno?.code === "ENOENT") {
    return new TerminalError({
      code: TerminalErrorCode.COMMAND_NOT_FOUND,
      message: errno.message,
      context,
      cause: error,
    });
  }

  if (error instanceof Error) {
    return new TerminalError({ code: TerminalErrorCode.EXECUTION_FAILED, message: error.message, context, cause: error });
  }

  return new TerminalError({
    code: TerminalErrorCode.UNKNOWN,
    message: typeof error === "string" ? error : "An unknown terminal error occurred",
    context,
    cause: error,
  });
}

