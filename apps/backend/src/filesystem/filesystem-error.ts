/**
 * filesystem-error.ts
 *
 * Normalized error type for the filesystem abstraction, following the
 * same funnel/shape pattern already established by `ProviderError`
 * (models/providers/base) and `ToolError` (tools/pipeline) — a single,
 * stable, JSON-serializable error per domain rather than raw `Error` or
 * raw `NodeJS.ErrnoException` leaking through the abstraction boundary.
 */

export enum FileSystemErrorCode {
  NOT_FOUND = "NOT_FOUND",
  ALREADY_EXISTS = "ALREADY_EXISTS",
  PATH_ESCAPES_ROOT = "PATH_ESCAPES_ROOT",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  NOT_A_DIRECTORY = "NOT_A_DIRECTORY",
  NOT_A_FILE = "NOT_A_FILE",
  IO_ERROR = "IO_ERROR",
  UNKNOWN = "UNKNOWN",
}

export interface FileSystemErrorContext {
  readonly root?: string;
  readonly path?: string;
  readonly [key: string]: unknown;
}

export interface FileSystemErrorOptions {
  readonly code: FileSystemErrorCode;
  readonly message: string;
  readonly context?: FileSystemErrorContext;
  readonly cause?: unknown;
}

export class FileSystemError extends Error {
  public readonly code: FileSystemErrorCode;
  public readonly context: FileSystemErrorContext;
  public override readonly cause?: unknown;
  public readonly timestamp: string;

  constructor(options: FileSystemErrorOptions) {
    super(options.message);
    this.name = "FileSystemError";
    this.code = options.code;
    this.context = options.context ?? {};
    this.cause = options.cause;
    this.timestamp = new Date().toISOString();

    Object.setPrototypeOf(this, FileSystemError.prototype);
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

  public static isFileSystemError(value: unknown): value is FileSystemError {
    return value instanceof FileSystemError;
  }
}

/** Maps a Node.js `NodeJS.ErrnoException` (from `node:fs`) onto a `FileSystemError`. */
export function normalizeFileSystemError(error: unknown, context?: FileSystemErrorContext): FileSystemError {
  if (FileSystemError.isFileSystemError(error)) {
    return context
      ? new FileSystemError({ code: error.code, message: error.message, cause: error.cause, context: { ...error.context, ...context } })
      : error;
  }

  const errno = error as NodeJS.ErrnoException | undefined;

  if (errno?.code === "ENOENT") {
    return new FileSystemError({ code: FileSystemErrorCode.NOT_FOUND, message: errno.message, context, cause: error });
  }
  if (errno?.code === "EEXIST") {
    return new FileSystemError({ code: FileSystemErrorCode.ALREADY_EXISTS, message: errno.message, context, cause: error });
  }
  if (errno?.code === "EACCES" || errno?.code === "EPERM") {
    return new FileSystemError({ code: FileSystemErrorCode.PERMISSION_DENIED, message: errno.message, context, cause: error });
  }
  if (errno?.code === "ENOTDIR") {
    return new FileSystemError({ code: FileSystemErrorCode.NOT_A_DIRECTORY, message: errno.message, context, cause: error });
  }
  if (errno?.code === "EISDIR") {
    return new FileSystemError({ code: FileSystemErrorCode.NOT_A_FILE, message: errno.message, context, cause: error });
  }

  if (error instanceof Error) {
    return new FileSystemError({ code: FileSystemErrorCode.IO_ERROR, message: error.message, context, cause: error });
  }

  return new FileSystemError({
    code: FileSystemErrorCode.UNKNOWN,
    message: typeof error === "string" ? error : "An unknown filesystem error occurred",
    context,
    cause: error,
  });
}

