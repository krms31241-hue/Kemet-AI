/**
 * http-client.ts
 *
 * Shared, provider-agnostic HTTP client built on the global `fetch`. Provides
 * timeout handling via `AbortController`, a pluggable retry policy with
 * exponential backoff, an authentication abstraction, a request/response
 * interceptor pipeline, and logging/metrics hooks.
 */

import {
  normalizeError,
  normalizeHttpErrorResponse,
  ProviderErrorContext,
  ProviderTimeoutSignal,
} from './provider-error.js';
import { ExponentialBackoffRetryPolicy, RetryPolicy, delay } from './retry-policy.js';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type HttpHeaders = Readonly<Record<string, string>>;

export type QueryValue = string | number | boolean | undefined | null;

export type ResponseParseMode = 'json' | 'text' | 'arraybuffer' | 'none';

/**
 * Structured logging hook. Implementations may forward to pino, winston,
 * console, or a no-op sink. Kept dependency-free so the provider foundation
 * never forces a logging library on consumers.
 */
export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

/** Per-attempt metrics emitted after every request, success or failure. */
export interface RequestMetricsSample {
  readonly providerName: string;
  readonly method: HttpMethod;
  readonly path: string;
  readonly statusCode?: number;
  readonly durationMs: number;
  readonly attempt: number;
  readonly success: boolean;
  readonly errorCode?: string;
  readonly retried: boolean;
}

/** Metrics sink. Implementations may forward to StatsD, Prometheus, etc. */
export interface MetricsRecorder {
  recordRequest(sample: RequestMetricsSample): void;
}

/**
 * Authentication abstraction so providers can supply bearer tokens, API
 * keys, signed headers, or rotate credentials without the HTTP client
 * knowing any provider-specific details.
 */
export interface AuthProvider {
  getAuthHeaders(): Promise<HttpHeaders> | HttpHeaders;
}

export interface HttpRequestOptions {
  readonly method?: HttpMethod;
  readonly headers?: HttpHeaders;
  readonly query?: Readonly<Record<string, QueryValue>>;
  readonly body?: unknown;
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
  readonly parseAs?: ResponseParseMode;
  readonly context?: ProviderErrorContext;
  readonly skipAuth?: boolean;
}

export interface HttpResponse<T> {
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly data: T;
  readonly durationMs: number;
  readonly attempts: number;
  readonly requestId?: string;
}

/** A fully-prepared, immutable request ready to be dispatched via fetch. */
export interface PreparedRequest {
  readonly url: string;
  readonly method: HttpMethod;
  readonly headers: Headers;
  readonly body?: BodyInit | null;
}

export type RequestInterceptor = (request: PreparedRequest) => Promise<PreparedRequest> | PreparedRequest;

export type ResponseInterceptor = (
  response: HttpResponse<unknown>,
) => Promise<HttpResponse<unknown>> | HttpResponse<unknown>;

export interface HttpClientConfig {
  /** Human-readable provider name, propagated into logs, metrics, and errors. */
  readonly providerName: string;
  readonly baseUrl: string;
  readonly defaultHeaders?: HttpHeaders;
  /** Default per-request timeout in milliseconds. Default 30_000. */
  readonly timeoutMs?: number;
  readonly retryPolicy?: RetryPolicy;
  readonly authProvider?: AuthProvider;
  readonly logger?: Logger;
  readonly metrics?: MetricsRecorder;
  readonly requestInterceptors?: readonly RequestInterceptor[];
  readonly responseInterceptors?: readonly ResponseInterceptor[];
  /** Injectable fetch implementation, primarily for testing. Defaults to global fetch. */
  readonly fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 30_000;

const NOOP_LOGGER: Logger = {
  debug: () => undefined,
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined,
};

const NOOP_METRICS: MetricsRecorder = {
  recordRequest: () => undefined,
};

/**
 * Shared HTTP client used by every concrete provider implementation. Not
 * intended to be subclassed; providers compose an `HttpClient` instance
 * rather than inheriting from it (favor composition over inheritance).
 */
export class HttpClient {
  private readonly providerName: string;
  private readonly baseUrl: string;
  private readonly defaultHeaders: HttpHeaders;
  private readonly timeoutMs: number;
  private readonly retryPolicy: RetryPolicy;
  private readonly authProvider?: AuthProvider;
  private readonly logger: Logger;
  private readonly metrics: MetricsRecorder;
  private readonly requestInterceptors: readonly RequestInterceptor[];
  private readonly responseInterceptors: readonly ResponseInterceptor[];
  private readonly fetchImpl: typeof fetch;

  constructor(config: HttpClientConfig) {
    if (!config.providerName) {
      throw new RangeError('HttpClientConfig.providerName is required');
    }
    if (!config.baseUrl) {
      throw new RangeError('HttpClientConfig.baseUrl is required');
    }

    this.providerName = config.providerName;
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.defaultHeaders = config.defaultHeaders ?? {};
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.retryPolicy = config.retryPolicy ?? new ExponentialBackoffRetryPolicy();
    this.authProvider = config.authProvider;
    this.logger = config.logger ?? NOOP_LOGGER;
    this.metrics = config.metrics ?? NOOP_METRICS;
    this.requestInterceptors = config.requestInterceptors ?? [];
    this.responseInterceptors = config.responseInterceptors ?? [];
    this.fetchImpl = config.fetchImpl ?? globalThis.fetch.bind(globalThis);

    if (typeof this.fetchImpl !== 'function') {
      throw new Error(
        `${this.providerName}: no fetch implementation available. Provide HttpClientConfig.fetchImpl for this runtime.`,
      );
    }
  }

  /** Issues a request and resolves with a fully-typed, parsed response. */
  public async request<T = unknown>(path: string, options: HttpRequestOptions = {}): Promise<HttpResponse<T>> {
    const method = options.method ?? 'GET';
    const url = this.buildUrl(path, options.query);
    const startedAt = Date.now();

    let attempt = 0;
    // The loop bound is maxRetries + 1 total attempts (initial + retries).
    for (;;) {
      attempt += 1;
      try {
        const response = await this.executeAttempt<T>(url, method, path, options, attempt);
        this.metrics.recordRequest({
          providerName: this.providerName,
          method,
          path,
          statusCode: response.status,
          durationMs: Date.now() - startedAt,
          attempt,
          success: true,
          retried: attempt > 1,
        });
        return response;
      } catch (rawError) {
        const errorContext: ProviderErrorContext = {
          providerName: this.providerName,
          method,
          url,
          attempt,
          ...options.context,
        };
        const error = normalizeError(rawError, errorContext);

        this.logger.warn(`${this.providerName}: request attempt ${attempt} failed`, {
          method,
          path,
          code: error.code,
          statusCode: error.statusCode,
          message: error.message,
        });

        const willRetry = this.retryPolicy.shouldRetry(error, attempt);

        this.metrics.recordRequest({
          providerName: this.providerName,
          method,
          path,
          statusCode: error.statusCode,
          durationMs: Date.now() - startedAt,
          attempt,
          success: false,
          errorCode: error.code,
          retried: willRetry,
        });

        if (!willRetry) {
          this.logger.error(`${this.providerName}: request failed permanently`, {
            method,
            path,
            code: error.code,
            attempts: attempt,
          });
          throw error;
        }

        const delayMs = this.retryPolicy.getDelayMs(attempt);
        this.logger.info(`${this.providerName}: retrying request`, {
          method,
          path,
          nextAttempt: attempt + 1,
          delayMs,
        });
        await delay(delayMs, options.signal);
      }
    }
  }

  public get<T = unknown>(path: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T = unknown>(path: string, body?: unknown, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  public put<T = unknown>(path: string, body?: unknown, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  public patch<T = unknown>(path: string, body?: unknown, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'PATCH', body });
  }

  public delete<T = unknown>(path: string, options: Omit<HttpRequestOptions, 'method' | 'body'> = {}): Promise<HttpResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }

  private async executeAttempt<T>(
    url: string,
    method: HttpMethod,
    path: string,
    options: HttpRequestOptions,
    attempt: number,
  ): Promise<HttpResponse<T>> {
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    const controller = new AbortController();
    const timeoutTimer = setTimeout(() => controller.abort(new ProviderTimeoutSignal(timeoutMs)), timeoutMs);

    const externalSignal = options.signal;
    const onExternalAbort = (): void => controller.abort(externalSignal?.reason);
    if (externalSignal) {
      if (externalSignal.aborted) {
        controller.abort(externalSignal.reason);
      } else {
        externalSignal.addEventListener('abort', onExternalAbort, { once: true });
      }
    }

    const startedAt = Date.now();

    try {
      const prepared = await this.prepareRequest(url, method, options);
      const rawResponse = await this.fetchImpl(prepared.url, {
        method: prepared.method,
        headers: prepared.headers,
        body: prepared.body,
        signal: controller.signal,
      });

      if (!rawResponse.ok) {
        const errorBody = await this.safeParseBody(rawResponse.clone());
        throw normalizeHttpErrorResponse({
          statusCode: rawResponse.status,
          statusText: rawResponse.statusText,
          body: errorBody,
          context: { providerName: this.providerName, method, url: prepared.url, attempt },
        });
      }

      const data = await this.parseBody<T>(rawResponse, options.parseAs);
      const httpResponse: HttpResponse<T> = {
        status: rawResponse.status,
        statusText: rawResponse.statusText,
        headers: rawResponse.headers,
        data,
        durationMs: Date.now() - startedAt,
        attempts: attempt,
        requestId: rawResponse.headers.get('x-request-id') ?? undefined,
      };

      return await this.runResponseInterceptors(httpResponse);
    } finally {
      clearTimeout(timeoutTimer);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    }
  }

  private async prepareRequest(url: string, method: HttpMethod, options: HttpRequestOptions): Promise<PreparedRequest> {
    const headers = new Headers();
    for (const [key, value] of Object.entries(this.defaultHeaders)) {
      headers.set(key, value);
    }

    if (this.authProvider && !options.skipAuth) {
      const authHeaders = await this.authProvider.getAuthHeaders();
      for (const [key, value] of Object.entries(authHeaders)) {
        headers.set(key, value);
      }
    }

    if (options.headers) {
      for (const [key, value] of Object.entries(options.headers)) {
        headers.set(key, value);
      }
    }

    let body: BodyInit | null | undefined;
    if (options.body !== undefined && method !== 'GET' && method !== 'HEAD') {
      if (typeof options.body === 'string' || options.body instanceof Uint8Array || options.body instanceof Blob) {
        body = options.body as BodyInit;
      } else if (options.body instanceof FormData || options.body instanceof URLSearchParams) {
        body = options.body;
      } else {
        if (!headers.has('content-type')) {
          headers.set('content-type', 'application/json');
        }
        body = JSON.stringify(options.body);
      }
    }

    let prepared: PreparedRequest = { url, method, headers, body };
    for (const interceptor of this.requestInterceptors) {
      prepared = await interceptor(prepared);
    }
    return prepared;
  }

  private async runResponseInterceptors<T>(response: HttpResponse<T>): Promise<HttpResponse<T>> {
    let current: HttpResponse<unknown> = response;
    for (const interceptor of this.responseInterceptors) {
      current = await interceptor(current);
    }
    return current as HttpResponse<T>;
  }

  private async parseBody<T>(response: Response, parseAs?: ResponseParseMode): Promise<T> {
    const mode = parseAs ?? this.inferParseMode(response);
    if (mode === 'none' || response.status === 204) {
      return undefined as unknown as T;
    }
    if (mode === 'arraybuffer') {
      return (await response.arrayBuffer()) as unknown as T;
    }
    if (mode === 'text') {
      return (await response.text()) as unknown as T;
    }
    const text = await response.text();
    if (text.length === 0) {
      return undefined as unknown as T;
    }
    return JSON.parse(text) as T;
  }

  private inferParseMode(response: Response): ResponseParseMode {
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json') || contentType.includes('+json')) {
      return 'json';
    }
    if (contentType.startsWith('text/')) {
      return 'text';
    }
    return 'json';
  }

  private async safeParseBody(response: Response): Promise<unknown> {
    try {
      const text = await response.text();
      if (text.length === 0) {
        return undefined;
      }
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return undefined;
    }
  }

  private buildUrl(path: string, query?: Readonly<Record<string, QueryValue>>): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}${normalizedPath}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value === undefined || value === null) {
          continue;
        }
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }
}

