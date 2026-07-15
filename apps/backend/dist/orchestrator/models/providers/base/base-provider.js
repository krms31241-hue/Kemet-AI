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
import { HttpClient, } from "./http-client.js";
import { normalizeError } from "./provider-error.js";
const NOOP_LOGGER = {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};
const NOOP_METRICS = {
    recordRequest: () => undefined,
};
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
export class BaseProvider {
    config;
    providerName;
    httpClient;
    logger;
    metrics;
    constructor(config) {
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
    getProviderName() {
        return this.providerName;
    }
    /**
     * Supplies authentication headers merged into every outgoing request.
     * The default implementation returns no headers; providers requiring
     * bearer tokens, API keys, or signed headers should override this.
     */
    getAuthHeaders() {
        return {};
    }
    /**
     * Optional cleanup hook (closing sockets, flushing metrics, cancelling
     * background timers). Providers with nothing to release may omit this;
     * the base implementation is a no-op.
     */
    async dispose() {
        return undefined;
    }
    /**
     * Core request pipeline every domain-specific provider method should
     * route through. Applies the before/after/error lifecycle hooks around
     * the shared `HttpClient`, ensuring every provider gets consistent
     * logging, metrics, and error normalization for free.
     */
    async execute(path, options = {}) {
        this.beforeRequest(path, options);
        try {
            const response = await this.httpClient.request(path, {
                ...options,
                context: { providerName: this.providerName },
            });
            this.afterResponse(path, response);
            return response;
        }
        catch (rawError) {
            const error = normalizeError(rawError, {
                providerName: this.providerName,
                path,
            });
            this.onError(path, error);
            throw error;
        }
    }
    /** Lifecycle hook invoked immediately before dispatch. Override to add tracing spans, etc. */
    beforeRequest(path, options) {
        this.logger.debug(`${this.providerName}: dispatching request`, {
            path,
            method: options.method ?? "GET",
        });
    }
    /** Lifecycle hook invoked after a successful response is received and parsed. */
    afterResponse(path, response) {
        this.logger.debug(`${this.providerName}: received response`, {
            path,
            status: response.status,
            attempts: response.attempts,
            durationMs: response.durationMs,
        });
    }
    /** Lifecycle hook invoked when a request ultimately fails (after retries are exhausted). */
    onError(path, error) {
        this.logger.error(`${this.providerName}: request failed`, {
            path,
            code: error.code,
            statusCode: error.statusCode,
            retryable: error.retryable,
        });
    }
    assertValidConfig(config) {
        if (!config ||
            typeof config.providerName !== "string" ||
            config.providerName.trim().length === 0) {
            throw new RangeError(`${this.constructor.name}: a non-empty "providerName" must be provided in the config`);
        }
        if (typeof config.baseUrl !== "string" ||
            config.baseUrl.trim().length === 0) {
            throw new RangeError(`${this.constructor.name}: a non-empty "baseUrl" must be provided in the config`);
        }
        try {
            // eslint-disable-next-line no-new
            new URL(config.baseUrl);
        }
        catch {
            throw new RangeError(`${this.constructor.name}: "baseUrl" must be a valid absolute URL, received "${config.baseUrl}"`);
        }
    }
}
