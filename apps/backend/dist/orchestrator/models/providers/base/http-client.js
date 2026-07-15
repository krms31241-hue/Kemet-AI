/**
 * http-client.ts
 *
 * Shared, provider-agnostic HTTP client built on the global `fetch`. Provides
 * timeout handling via `AbortController`, a pluggable retry policy with
 * exponential backoff, an authentication abstraction, a request/response
 * interceptor pipeline, and logging/metrics hooks.
 */
import { normalizeError, normalizeHttpErrorResponse, ProviderTimeoutSignal, } from './provider-error.js';
import { ExponentialBackoffRetryPolicy, delay } from './retry-policy.js';
const DEFAULT_TIMEOUT_MS = 30_000;
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
 * Shared HTTP client used by every concrete provider implementation. Not
 * intended to be subclassed; providers compose an `HttpClient` instance
 * rather than inheriting from it (favor composition over inheritance).
 */
export class HttpClient {
    providerName;
    baseUrl;
    defaultHeaders;
    timeoutMs;
    retryPolicy;
    authProvider;
    logger;
    metrics;
    requestInterceptors;
    responseInterceptors;
    fetchImpl;
    constructor(config) {
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
            throw new Error(`${this.providerName}: no fetch implementation available. Provide HttpClientConfig.fetchImpl for this runtime.`);
        }
    }
    /** Issues a request and resolves with a fully-typed, parsed response. */
    async request(path, options = {}) {
        const method = options.method ?? 'GET';
        const url = this.buildUrl(path, options.query);
        const startedAt = Date.now();
        let attempt = 0;
        // The loop bound is maxRetries + 1 total attempts (initial + retries).
        for (;;) {
            attempt += 1;
            try {
                const response = await this.executeAttempt(url, method, path, options, attempt);
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
            }
            catch (rawError) {
                const errorContext = {
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
    get(path, options = {}) {
        return this.request(path, { ...options, method: 'GET' });
    }
    post(path, body, options = {}) {
        return this.request(path, { ...options, method: 'POST', body });
    }
    put(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PUT', body });
    }
    patch(path, body, options = {}) {
        return this.request(path, { ...options, method: 'PATCH', body });
    }
    delete(path, options = {}) {
        return this.request(path, { ...options, method: 'DELETE' });
    }
    async executeAttempt(url, method, path, options, attempt) {
        const timeoutMs = options.timeoutMs ?? this.timeoutMs;
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => controller.abort(new ProviderTimeoutSignal(timeoutMs)), timeoutMs);
        const externalSignal = options.signal;
        const onExternalAbort = () => controller.abort(externalSignal?.reason);
        if (externalSignal) {
            if (externalSignal.aborted) {
                controller.abort(externalSignal.reason);
            }
            else {
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
            const data = await this.parseBody(rawResponse, options.parseAs);
            const httpResponse = {
                status: rawResponse.status,
                statusText: rawResponse.statusText,
                headers: rawResponse.headers,
                data,
                durationMs: Date.now() - startedAt,
                attempts: attempt,
                requestId: rawResponse.headers.get('x-request-id') ?? undefined,
            };
            return await this.runResponseInterceptors(httpResponse);
        }
        finally {
            clearTimeout(timeoutTimer);
            externalSignal?.removeEventListener('abort', onExternalAbort);
        }
    }
    async prepareRequest(url, method, options) {
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
        let body;
        if (options.body !== undefined && method !== 'GET' && method !== 'HEAD') {
            if (typeof options.body === 'string' || options.body instanceof Uint8Array || options.body instanceof Blob) {
                body = options.body;
            }
            else if (options.body instanceof FormData || options.body instanceof URLSearchParams) {
                body = options.body;
            }
            else {
                if (!headers.has('content-type')) {
                    headers.set('content-type', 'application/json');
                }
                body = JSON.stringify(options.body);
            }
        }
        let prepared = { url, method, headers, body };
        for (const interceptor of this.requestInterceptors) {
            prepared = await interceptor(prepared);
        }
        return prepared;
    }
    async runResponseInterceptors(response) {
        let current = response;
        for (const interceptor of this.responseInterceptors) {
            current = await interceptor(current);
        }
        return current;
    }
    async parseBody(response, parseAs) {
        const mode = parseAs ?? this.inferParseMode(response);
        if (mode === 'none' || response.status === 204) {
            return undefined;
        }
        if (mode === 'arraybuffer') {
            return (await response.arrayBuffer());
        }
        if (mode === 'text') {
            return (await response.text());
        }
        const text = await response.text();
        if (text.length === 0) {
            return undefined;
        }
        return JSON.parse(text);
    }
    inferParseMode(response) {
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json') || contentType.includes('+json')) {
            return 'json';
        }
        if (contentType.startsWith('text/')) {
            return 'text';
        }
        return 'json';
    }
    async safeParseBody(response) {
        try {
            const text = await response.text();
            if (text.length === 0) {
                return undefined;
            }
            try {
                return JSON.parse(text);
            }
            catch {
                return text;
            }
        }
        catch {
            return undefined;
        }
    }
    buildUrl(path, query) {
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
