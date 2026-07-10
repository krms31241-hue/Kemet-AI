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
export enum ProviderErrorCode {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  ABORTED = 'ABORTED',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  SERIALIZATION = 'SERIALIZATION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Structured context attached to a `ProviderError`. Kept as plain,
 * JSON-serializable data so it can be safely forwarded to logging and
 * metrics sinks without leaking class instances or circular references.
 */
export interface ProviderErrorContext {
  readonly providerName?: string;
  readonly requestId?: string;
  readonly method?: string;
  readonly url?: string;
  readonly statusCode?: number;
  readonly attempt?: number;
  readonly [key: string]: unknown;
}

export interface ProviderErrorOptions {
  readonly code: ProviderErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly statusCode?: number;
  readonly context?: ProviderErrorContext;
  readonly cause?: unknown;
}

/**
 * The single error type raised across the provider foundation. All
 * transport-level exceptions (fetch rejections, HTTP error responses,
 * abort signals, JSON parse failures) are converted into instances of
 * this class via {@link normalizeError}.
 */
export class ProviderError extends Error {
  public readonly code: ProviderErrorCode;
  public readonly retryable: boolean;
  public readonly statusCode?: number;
  public readonly context: ProviderErrorContext;
  public override readonly cause?: unknown;
  public readonly timestamp: string;

  constructor(options: ProviderErrorOptions) {
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
  public toJSON(): Record<string, unknown> {
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

  public static isProviderError(value: unknown): value is ProviderError {
    return value instanceof ProviderError;
  }
}

/** Maps an HTTP status code to a {@link ProviderErrorCode}. */
function classifyStatusCode(statusCode: number): ProviderErrorCode {
  if (statusCode === 401) return ProviderErrorCode.AUTHENTICATION;
  if (statusCode === 403) return ProviderErrorCode.AUTHORIZATION;
  if (statusCode === 404) return ProviderErrorCode.NOT_FOUND;
  if (statusCode === 429) return ProviderErrorCode.RATE_LIMITED;
  if (statusCode === 422 || statusCode === 400) return ProviderErrorCode.VALIDATION;
  if (statusCode >= 500) return ProviderErrorCode.SERVER;
  return ProviderErrorCode.UNKNOWN;
}

/** Whether a given error code should generally be considered retryable. */
function isRetryableCode(code: ProviderErrorCode): boolean {
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
export function normalizeHttpErrorResponse(params: {
  readonly statusCode: number;
  readonly statusText: string;
  readonly body?: unknown;
  readonly context?: ProviderErrorContext;
}): ProviderError {
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

function extractMessageFromBody(body: unknown): string | undefined {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const candidate = record.message ?? record.error ?? record.error_message;
    if (typeof candidate === 'string') {
      return candidate;
    }
    if (candidate && typeof candidate === 'object') {
      const nested = (candidate as Record<string, unknown>).message;
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
export function normalizeError(error: unknown, context?: ProviderErrorContext): ProviderError {
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

/** Internal marker interface used to detect our own timeout signal reason. */
interface TimeoutErrorLike {
  readonly isProviderTimeout: true;
}

function isTimeoutError(error: unknown): error is TimeoutErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Partial<TimeoutErrorLike>).isProviderTimeout === true
  );
}

function withMergedContext(error: ProviderError, context: ProviderErrorContext): ProviderError {
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
export class ProviderTimeoutSignal extends Error implements TimeoutErrorLike {
  public readonly isProviderTimeout = true as const;

  constructor(timeoutMs: number) {
    super(`Operation timed out after ${timeoutMs}ms`);
    this.name = 'ProviderTimeoutSignal';
    Object.setPrototypeOf(this, ProviderTimeoutSignal.prototype);
  }
}

