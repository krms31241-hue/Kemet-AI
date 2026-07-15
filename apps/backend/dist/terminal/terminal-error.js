/**
 * terminal-error.ts
 *
 * Normalized error type for the terminal execution domain. Same
 * funnel/shape pattern as `ProviderError`, `ToolError`, and
 * `FileSystemError` elsewhere in this codebase.
 */
export var TerminalErrorCode;
(function (TerminalErrorCode) {
    TerminalErrorCode["COMMAND_NOT_FOUND"] = "COMMAND_NOT_FOUND";
    TerminalErrorCode["TIMEOUT"] = "TIMEOUT";
    TerminalErrorCode["OUTPUT_LIMIT_EXCEEDED"] = "OUTPUT_LIMIT_EXCEEDED";
    TerminalErrorCode["EXECUTION_FAILED"] = "EXECUTION_FAILED";
    TerminalErrorCode["UNKNOWN"] = "UNKNOWN";
})(TerminalErrorCode || (TerminalErrorCode = {}));
export class TerminalError extends Error {
    code;
    context;
    cause;
    timestamp;
    constructor(options) {
        super(options.message);
        this.name = "TerminalError";
        this.code = options.code;
        this.context = options.context ?? {};
        this.cause = options.cause;
        this.timestamp = new Date().toISOString();
        Object.setPrototypeOf(this, TerminalError.prototype);
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
    static isTerminalError(value) {
        return value instanceof TerminalError;
    }
}
export function normalizeTerminalError(error, context) {
    if (TerminalError.isTerminalError(error)) {
        return context
            ? new TerminalError({ code: error.code, message: error.message, cause: error.cause, context: { ...error.context, ...context } })
            : error;
    }
    const errno = error;
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
