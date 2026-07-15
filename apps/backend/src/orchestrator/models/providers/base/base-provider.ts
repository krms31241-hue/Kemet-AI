/**
 * base-provider.ts
 *
 * Abstract foundation every concrete model provider (OpenAI, Anthropic,
 * local runtimes, etc.) in the Kemet AI Runtime extends. Wires together the
 * shared `HttpClient`, authentication, retry policy, and logging/metrics
 * hooks, and exposes a small, well-defined extension surface for
 * subclasses (Liskov-substitutable, open for extension / closed for
 * modification).
 */

import {
  AuthProvider,
  HttpClient,
  HttpHeaders,
  HttpRequestOptions,
  HttpResponse,
  Logger,
  MetricsRecorder,
  RequestInterceptor,
  ResponseInterceptor,
} from "./http-client.js";
import { normalizeError, ProviderError } from "./provider-error.js";
import { RetryPolicy } from "./retry-policy.js";

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
 * Base configuration accepted by every provider. Concrete providers extend
 * this with provider-specific fields (model lists, organization IDs, etc.)
 * via the generic `TConfig` parameter on {@link BaseProvider}.
 */
export interface ProviderConfig {
  /**
   * Stable, unique identifier for this provider (e.g. `"openai"`,
   * `"anthropic"`), propagated into the `HttpClient`, logs, metrics, and
   * normalized errors.
   */
  readonly providerName: string;
  readonly baseUrl: string;
  readonly apiKey?: string;
  readonly timeoutMs?: number;
  readonly retryPolicy?: RetryPolicy;
  readonly logger?: Logger;
  readonly metrics?: MetricsRecorder;
  readonly defaultHeaders?: HttpHeaders;
  readonly requestInterceptors?: readonly RequestInterceptor[];
  readonly responseInterceptors?: readonly ResponseInterceptor[];
  readonly fetchImpl?: typeof fetch;
}

export type ProviderRequestOptions = Omit<HttpRequestOptions, "context">;

/** Machine-readable capability descriptor a provider can advertise to the orchestrator. */
export interface ProviderCapabilities {
  readonly streaming: boolean;
  readonly toolUse: boolean;
  readonly vision: boolean;
  readonly maxContextTokens?: number;
}

/**
 * Abstract base class for all model providers. Concrete subclasses supply
 * their identity via `config.providerName` (not by overriding a virtual
 * method), must implement health checking and capability reporting, and
 * are expected to implement their own domain methods (e.g. `complete`,
 * `stream`, `embed`) on top of the protected `execute` helper.
 *
 * Subclasses provide authentication by overriding {@link getAuthHeaders};
 * the default implementation supplies no auth headers, so a provider with
 * no authentication requirement needs no override at all.
 */
export abstract class BaseProvider<
  TConfig extends ProviderConfig = ProviderConfig,
> implements AuthProvider {
  protected readonly config: TConfig;
  protected readonly providerName: string;
  protected readonly httpClient: HttpClient;
  protected readonly logger: Logger;
  protected readonly metrics: MetricsRecorder;

  protected constructor(config: TConfig) {
    this.assertValidConfig(config);
    this.config = config;
    this.providerName = config.providerName;
    this.logger = config.logger ?? NOOP_LOGGER;
    this.metrics = config.metrics ?? NOOP_METRICS;

    this.httpClient = new HttpClient({
      providerName: this.providerName,
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs,
      retryPolicy: config.retryPolicy,
      authProvider: this,
      logger: this.logger,
      metrics: this.metrics,
      defaultHeaders: config.defaultHeaders,
      requestInterceptors: config.requestInterceptors,
      responseInterceptors: config.responseInterceptors,
      fetchImpl: config.fetchImpl,
    });
  }

  /** Stable, unique identifier for this provider, as supplied via `config.providerName`. */
  public getProviderName(): string {
    return this.providerName;
  }

  /** Declares what this provider supports so the orchestrator can route requests correctly. */
  public abstract getCapabilities(): ProviderCapabilities;

  /**
   * Performs a lightweight liveness/readiness check against the upstream
   * provider (e.g. hitting a `/health` or `/models` endpoint). Must resolve
   * `false` rather than throw when the provider is unreachable.
   */
  public abstract healthCheck(): Promise<boolean>;

  /**
   * Supplies authentication headers merged into every outgoing request.
   * The default implementation returns no headers; providers requiring
   * bearer tokens, API keys, or signed headers should override this.
   */
  public getAuthHeaders(): Promise<HttpHeaders> | HttpHeaders {
    return {};
  }

  /**
   * Optional cleanup hook (closing sockets, flushing metrics, cancelling
   * background timers). Providers with nothing to release may omit this;
   * the base implementation is a no-op.
   */
  public async dispose(): Promise<void> {
    return undefined;
  }

  /**
   * Core request pipeline every domain-specific provider method should
   * route through. Applies the before/after/error lifecycle hooks around
   * the shared `HttpClient`, ensuring every provider gets consistent
   * logging, metrics, and error normalization for free.
   */
  protected async execute<T>(
    path: string,
    options: ProviderRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    this.beforeRequest(path, options);
    try {
      const response = await this.httpClient.request<T>(path, {
        ...options,
        context: { providerName: this.providerName },
      });
      this.afterResponse(path, response);
      return response;
    } catch (rawError) {
      const error = normalizeError(rawError, {
        providerName: this.providerName,
        path,
      });
      this.onError(path, error);
      throw error;
    }
  }

  /** Lifecycle hook invoked immediately before dispatch. Override to add tracing spans, etc. */
  protected beforeRequest(path: string, options: ProviderRequestOptions): void {
    this.logger.debug(`${this.providerName}: dispatching request`, {
      path,
      method: options.method ?? "GET",
    });
  }

  /** Lifecycle hook invoked after a successful response is received and parsed. */
  protected afterResponse<T>(path: string, response: HttpResponse<T>): void {
    this.logger.debug(`${this.providerName}: received response`, {
      path,
      status: response.status,
      attempts: response.attempts,
      durationMs: response.durationMs,
    });
  }

  /** Lifecycle hook invoked when a request ultimately fails (after retries are exhausted). */
  protected onError(path: string, error: ProviderError): void {
    this.logger.error(`${this.providerName}: request failed`, {
      path,
      code: error.code,
      statusCode: error.statusCode,
      retryable: error.retryable,
    });
  }

  private assertValidConfig(config: TConfig): void {
    if (
      !config ||
      typeof config.providerName !== "string" ||
      config.providerName.trim().length === 0
    ) {
      throw new RangeError(
        `${this.constructor.name}: a non-empty "providerName" must be provided in the config`,
      );
    }
    if (
      typeof config.baseUrl !== "string" ||
      config.baseUrl.trim().length === 0
    ) {
      throw new RangeError(
        `${this.constructor.name}: a non-empty "baseUrl" must be provided in the config`,
      );
    }

    try {
      // eslint-disable-next-line no-new
      new URL(config.baseUrl);
    } catch {
      throw new RangeError(
        `${this.constructor.name}: "baseUrl" must be a valid absolute URL, received "${config.baseUrl}"`,
      );
    }
  }
}
