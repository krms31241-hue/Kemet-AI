/**
 * provider-error.ts
 *
 * Normalized error taxonomy for the Kemet AI Runtime provider layer.
 * Every failure that crosses a provider boundary (network, HTTP, timeout,
 * abort, auth, validation) is normalized into a single `ProviderError`
 * shape so that callers never have to branch on the underlying transport.
 */
/**
 * Stable, machine-readable error classification. Consumers (retry policy,
 * metrics, alerting) should switch on this rather than on `instanceof`
 * chains or string matching against `message`.
 */
export var ProviderErrorCode;
(function (ProviderErrorCode) {
    ProviderErrorCode["NETWORK"] = "NETWORK";
    ProviderErrorCode["TIMEOUT"] = "TIMEOUT";
    ProviderErrorCode["ABORTED"] = "ABORTED";
    ProviderErrorCode["AUTHENTICATION"] = "AUTHENTICATION";
    ProviderErrorCode["AUTHORIZATION"] = "AUTHORIZATION";
    ProviderErrorCode["RATE_LIMITED"] = "RATE_LIMITED";
    ProviderErrorCode["VALIDATION"] = "VALIDATION";
    ProviderErrorCode["NOT_FOUND"] = "NOT_FOUND";
    ProviderErrorCode["SERVER"] = "SERVER";
    ProviderErrorCode["SERIALIZATION"] = "SERIALIZATION";
    ProviderErrorCode["UNKNOWN"] = "UNKNOWN";
})(ProviderErrorCode || (ProviderErrorCode = {}));
/**
 * The single error type raised across the provider foundation. All
 * transport-level exceptions (fetch rejections, HTTP error responses,
 * abort signals, JSON parse failures) are converted into instances of
 * this class via {@link normalizeError}.
 */
export class ProviderError extends Error {
    code;
    retryable;
    statusCode;
    context;
    cause;
    timestamp;
    constructor(options) {
        super(options.message);
        this.name = 'ProviderError';
        this.code = options.code;
        this.retryable = options.retryable;
        this.statusCode = options.statusCode;
        this.context = options.context ?? {};
        this.cause = options.cause;
        this.timestamp = new Date().toISOString();
        // Maintain proper prototype chain when compiled targets downlevel `Error`.
        Object.setPrototypeOf(this, ProviderError.prototype);
    }
    /** Returns a plain, JSON-safe representation suitable for logging. */
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            retryable: this.retryable,
            statusCode: this.statusCode,
            context: this.context,
            timestamp: this.timestamp,
            stack: this.stack,
        };
    }
    static isProviderError(value) {
        return value instanceof ProviderError;
    }
}
/** Maps an HTTP status code to a {@link ProviderErrorCode}. */
function classifyStatusCode(statusCode) {
    if (statusCode === 401)
        return ProviderErrorCode.AUTHENTICATION;
    if (statusCode === 403)
        return ProviderErrorCode.AUTHORIZATION;
    if (statusCode === 404)
        return ProviderErrorCode.NOT_FOUND;
    if (statusCode === 429)
        return ProviderErrorCode.RATE_LIMITED;
    if (statusCode === 422 || statusCode === 400)
        return ProviderErrorCode.VALIDATION;
    if (statusCode >= 500)
        return ProviderErrorCode.SERVER;
    return ProviderErrorCode.UNKNOWN;
}
/** Whether a given error code should generally be considered retryable. */
function isRetryableCode(code) {
    switch (code) {
        case ProviderErrorCode.NETWORK:
        case ProviderErrorCode.TIMEOUT:
        case ProviderErrorCode.RATE_LIMITED:
        case ProviderErrorCode.SERVER:
            return true;
        case ProviderErrorCode.ABORTED:
        case ProviderErrorCode.AUTHENTICATION:
        case ProviderErrorCode.AUTHORIZATION:
        case ProviderErrorCode.VALIDATION:
        case ProviderErrorCode.NOT_FOUND:
        case ProviderErrorCode.SERIALIZATION:
        case ProviderErrorCode.UNKNOWN:
        default:
            return false;
    }
}
/**
 * Builds a {@link ProviderError} from an HTTP response that was received
 * successfully at the transport level but represents an application-level
 * failure (non-2xx status).
 */
export function normalizeHttpErrorResponse(params) {
    const code = classifyStatusCode(params.statusCode);
    const bodyMessage = extractMessageFromBody(params.body);
    return new ProviderError({
        code,
        message: bodyMessage ?? `Request failed with status ${params.statusCode} ${params.statusText}`,
        retryable: isRetryableCode(code),
        statusCode: params.statusCode,
        context: { ...params.context, statusCode: params.statusCode },
        cause: params.body,
    });
}
function extractMessageFromBody(body) {
    if (body && typeof body === 'object') {
        const record = body;
        const candidate = record.message ?? record.error ?? record.error_message;
        if (typeof candidate === 'string') {
            return candidate;
        }
        if (candidate && typeof candidate === 'object') {
            const nested = candidate.message;
            if (typeof nested === 'string') {
                return nested;
            }
        }
    }
    return undefined;
}
/**
 * Normalizes any thrown value (network failure, abort, timeout, unexpected
 * exception) that occurred while attempting a request into a
 * {@link ProviderError}. This is the single funnel every catch block in the
 * HTTP client and base provider should route through.
 */
export function normalizeError(error, context) {
    if (ProviderError.isProviderError(error)) {
        return context ? withMergedContext(error, context) : error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
        return new ProviderError({
            code: ProviderErrorCode.ABORTED,
            message: 'Request was aborted',
            retryable: false,
            context,
            cause: error,
        });
    }
    if (isTimeoutError(error)) {
        return new ProviderError({
            code: ProviderErrorCode.TIMEOUT,
            message: 'Request timed out',
            retryable: true,
            context,
            cause: error,
        });
    }
    if (error instanceof TypeError) {
        // `fetch` rejects with a TypeError for DNS failures, connection resets,
        // refused connections, and similar low-level network faults.
        return new ProviderError({
            code: ProviderErrorCode.NETWORK,
            message: error.message || 'Network request failed',
            retryable: true,
            context,
            cause: error,
        });
    }
    if (error instanceof SyntaxError) {
        return new ProviderError({
            code: ProviderErrorCode.SERIALIZATION,
            message: `Failed to parse response body: ${error.message}`,
            retryable: false,
            context,
            cause: error,
        });
    }
    if (error instanceof Error) {
        return new ProviderError({
            code: ProviderErrorCode.UNKNOWN,
            message: error.message,
            retryable: false,
            context,
            cause: error,
        });
    }
    return new ProviderError({
        code: ProviderErrorCode.UNKNOWN,
        message: typeof error === 'string' ? error : 'An unknown provider error occurred',
        retryable: false,
        context,
        cause: error,
    });
}
function isTimeoutError(error) {
    return (typeof error === 'object' &&
        error !== null &&
        error.isProviderTimeout === true);
}
function withMergedContext(error, context) {
    return new ProviderError({
        code: error.code,
        message: error.message,
        retryable: error.retryable,
        statusCode: error.statusCode,
        cause: error.cause,
        context: { ...error.context, ...context },
    });
}
/** Sentinel error used to signal an intentional provider-side timeout abort. */
export class ProviderTimeoutSignal extends Error {
    isProviderTimeout = true;
    constructor(timeoutMs) {
        super(`Operation timed out after ${timeoutMs}ms`);
        this.name = 'ProviderTimeoutSignal';
        Object.setPrototypeOf(this, ProviderTimeoutSignal.prototype);
    }
}
