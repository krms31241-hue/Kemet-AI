/**
 * retry-policy.ts
 *
 * Configurable retry policy abstraction for provider HTTP calls, with a
 * production-ready exponential backoff + jitter implementation.
 */

import { ProviderError, ProviderErrorCode } from './provider-error.js';

/**
 * Contract for any retry policy consumed by {@link HttpClient}. Kept
 * intentionally minimal (interface segregation) so alternative strategies
 * (fixed delay, no-retry, token-bucket aware policies, etc.) can be swapped
 * in without touching the HTTP client.
 */
export interface RetryPolicy {
  /** Maximum number of retry attempts (not counting the initial attempt). */
  readonly maxRetries: number;

  /**
   * Decides whether a failed attempt should be retried.
   * @param error - the normalized error from the failed attempt.
   * @param attempt - the attempt number that just failed, starting at 1.
   */
  shouldRetry(error: ProviderError, attempt: number): boolean;

  /**
   * Computes the delay, in milliseconds, to wait before the next attempt.
   * @param attempt - the attempt number that just failed, starting at 1.
   */
  getDelayMs(attempt: number): number;
}

export interface ExponentialBackoffOptions {
  /** Maximum number of retry attempts after the initial request. Default 3. */
  readonly maxRetries?: number;
  /** Base delay in milliseconds for the first retry. Default 250. */
  readonly initialDelayMs?: number;
  /** Upper bound on any single computed delay. Default 10_000. */
  readonly maxDelayMs?: number;
  /** Multiplier applied to the delay on each subsequent attempt. Default 2. */
  readonly backoffMultiplier?: number;
  /** Whether to apply random jitter to computed delays. Default true. */
  readonly jitter?: boolean;
  /** Error codes that are considered retryable in addition to the error's own `retryable` flag. */
  readonly retryableCodes?: ReadonlySet<ProviderErrorCode>;
  /** Optional explicit set of HTTP status codes to retry on (e.g. 408, 429, 502, 503, 504). */
  readonly retryableStatusCodes?: ReadonlySet<number>;
}

const DEFAULT_RETRYABLE_STATUS_CODES: ReadonlySet<number> = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

const DEFAULT_OPTIONS: Required<Omit<ExponentialBackoffOptions, 'retryableCodes' | 'retryableStatusCodes'>> = {
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
export class ExponentialBackoffRetryPolicy implements RetryPolicy {
  public readonly maxRetries: number;

  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;
  private readonly backoffMultiplier: number;
  private readonly jitter: boolean;
  private readonly retryableCodes: ReadonlySet<ProviderErrorCode>;
  private readonly retryableStatusCodes: ReadonlySet<number>;

  constructor(options: ExponentialBackoffOptions = {}) {
    this.maxRetries = options.maxRetries ?? DEFAULT_OPTIONS.maxRetries;
    this.initialDelayMs = options.initialDelayMs ?? DEFAULT_OPTIONS.initialDelayMs;
    this.maxDelayMs = options.maxDelayMs ?? DEFAULT_OPTIONS.maxDelayMs;
    this.backoffMultiplier = options.backoffMultiplier ?? DEFAULT_OPTIONS.backoffMultiplier;
    this.jitter = options.jitter ?? DEFAULT_OPTIONS.jitter;
    this.retryableCodes = options.retryableCodes ?? new Set<ProviderErrorCode>();
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

  public shouldRetry(error: ProviderError, attempt: number): boolean {
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

  public getDelayMs(attempt: number): number {
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
export class NoRetryPolicy implements RetryPolicy {
  public readonly maxRetries = 0;

  public shouldRetry(): boolean {
    return false;
  }

  public getDelayMs(): number {
    return 0;
  }
}

/** Suspends execution for the given duration, honoring an abort signal. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }

    const timer = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = (): void => {
      cleanup();
      reject(signal?.reason);
    };

    const cleanup = (): void => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', onAbort);
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

