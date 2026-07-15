/**
 * retry-policy.ts
 *
 * Configurable retry policy abstraction for provider HTTP calls, with a
 * production-ready exponential backoff + jitter implementation.
 */
const DEFAULT_RETRYABLE_STATUS_CODES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    initialDelayMs: 250,
    maxDelayMs: 10_000,
    backoffMultiplier: 2,
    jitter: true,
};
/**
 * Exponential backoff retry policy with optional full jitter, following the
 * "Exponential Backoff And Jitter" pattern to avoid thundering-herd retries
 * against a recovering upstream.
 */
export class ExponentialBackoffRetryPolicy {
    maxRetries;
    initialDelayMs;
    maxDelayMs;
    backoffMultiplier;
    jitter;
    retryableCodes;
    retryableStatusCodes;
    constructor(options = {}) {
        this.maxRetries = options.maxRetries ?? DEFAULT_OPTIONS.maxRetries;
        this.initialDelayMs = options.initialDelayMs ?? DEFAULT_OPTIONS.initialDelayMs;
        this.maxDelayMs = options.maxDelayMs ?? DEFAULT_OPTIONS.maxDelayMs;
        this.backoffMultiplier = options.backoffMultiplier ?? DEFAULT_OPTIONS.backoffMultiplier;
        this.jitter = options.jitter ?? DEFAULT_OPTIONS.jitter;
        this.retryableCodes = options.retryableCodes ?? new Set();
        this.retryableStatusCodes = options.retryableStatusCodes ?? DEFAULT_RETRYABLE_STATUS_CODES;
        if (this.maxRetries < 0) {
            throw new RangeError('maxRetries must be >= 0');
        }
        if (this.initialDelayMs <= 0) {
            throw new RangeError('initialDelayMs must be > 0');
        }
        if (this.maxDelayMs < this.initialDelayMs) {
            throw new RangeError('maxDelayMs must be >= initialDelayMs');
        }
        if (this.backoffMultiplier <= 1) {
            throw new RangeError('backoffMultiplier must be > 1');
        }
    }
    shouldRetry(error, attempt) {
        if (attempt > this.maxRetries) {
            return false;
        }
        if (error.statusCode !== undefined && this.retryableStatusCodes.has(error.statusCode)) {
            return true;
        }
        if (this.retryableCodes.has(error.code)) {
            return true;
        }
        return error.retryable;
    }
    getDelayMs(attempt) {
        const exponential = this.initialDelayMs * Math.pow(this.backoffMultiplier, attempt - 1);
        const capped = Math.min(exponential, this.maxDelayMs);
        if (!this.jitter) {
            return capped;
        }
        // Full jitter: uniform random value in [0, capped].
        return Math.floor(Math.random() * capped);
    }
}
/** A policy that never retries; useful for idempotency-sensitive providers. */
export class NoRetryPolicy {
    maxRetries = 0;
    shouldRetry() {
        return false;
    }
    getDelayMs() {
        return 0;
    }
}
/** Suspends execution for the given duration, honoring an abort signal. */
export function delay(ms, signal) {
    if (ms <= 0) {
        return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
        if (signal?.aborted) {
            reject(signal.reason);
            return;
        }
        const timer = setTimeout(() => {
            cleanup();
            resolve();
        }, ms);
        const onAbort = () => {
            cleanup();
            reject(signal?.reason);
        };
        const cleanup = () => {
            clearTimeout(timer);
            signal?.removeEventListener('abort', onAbort);
        };
        signal?.addEventListener('abort', onAbort, { once: true });
    });
}
