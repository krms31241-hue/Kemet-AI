/**
 * filesystem-error.ts
 *
 * Normalized error type for the filesystem abstraction, following the
 * same funnel/shape pattern already established by `ProviderError`
 * (models/providers/base) and `ToolError` (tools/pipeline) — a single,
 * stable, JSON-serializable error per domain rather than raw `Error` or
 * raw `NodeJS.ErrnoException` leaking through the abstraction boundary.
 */
export var FileSystemErrorCode;
(function (FileSystemErrorCode) {
    FileSystemErrorCode["NOT_FOUND"] = "NOT_FOUND";
    FileSystemErrorCode["ALREADY_EXISTS"] = "ALREADY_EXISTS";
    FileSystemErrorCode["PATH_ESCAPES_ROOT"] = "PATH_ESCAPES_ROOT";
    FileSystemErrorCode["PERMISSION_DENIED"] = "PERMISSION_DENIED";
    FileSystemErrorCode["NOT_A_DIRECTORY"] = "NOT_A_DIRECTORY";
    FileSystemErrorCode["NOT_A_FILE"] = "NOT_A_FILE";
    FileSystemErrorCode["IO_ERROR"] = "IO_ERROR";
    FileSystemErrorCode["UNKNOWN"] = "UNKNOWN";
})(FileSystemErrorCode || (FileSystemErrorCode = {}));
export class FileSystemError extends Error {
    code;
    context;
    cause;
    timestamp;
    constructor(options) {
        super(options.message);
        this.name = "FileSystemError";
        this.code = options.code;
        this.context = options.context ?? {};
        this.cause = options.cause;
        this.timestamp = new Date().toISOString();
        Object.setPrototypeOf(this, FileSystemError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack,
        };
    }
    static isFileSystemError(value) {
        return value instanceof FileSystemError;
    }
}
/** Maps a Node.js `NodeJS.ErrnoException` (from `node:fs`) onto a `FileSystemError`. */
export function normalizeFileSystemError(error, context) {
    if (FileSystemError.isFileSystemError(error)) {
        return context
            ? new FileSystemError({ code: error.code, message: error.message, cause: error.cause, context: { ...error.context, ...context } })
            : error;
    }
    const errno = error;
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
