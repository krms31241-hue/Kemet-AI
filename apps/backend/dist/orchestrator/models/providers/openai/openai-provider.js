/**
 * openai-provider.ts
 *
 * Concrete OpenAI implementation of the provider foundation. Extends
 * `BaseProvider` for the shared HTTP/retry/auth/logging machinery and
 * implements `StreamingCapableProvider` (the `Provider` interface plus
 * `chatStream`) so it can be registered and routed like any other
 * provider.
 *
 * Streaming deliberately bypasses `HttpClient` (which has no SSE/stream
 * primitive) and talks to `fetch` directly, reusing the same auth headers,
 * timeout, and error-normalization functions as the rest of the provider
 * foundation so its failure modes stay consistent with non-streaming
 * requests.
 */
import { BaseProvider, normalizeError, normalizeHttpErrorResponse, ProviderError, ProviderErrorCode, ProviderTimeoutSignal, } from "../base/index.js";
import { OPENAI_DEFAULT_BASE_URL, OPENAI_DEFAULT_CAPABILITIES, OPENAI_DEFAULT_ID, OPENAI_DEFAULT_NAME, fromOpenAIChatCompletionResponse, fromOpenAIChunk, toOpenAIChatCompletionRequestBody, toProviderCapabilities, } from "./openai.types.js";
const HEALTH_CHECK_TIMEOUT_MS = 5_000;
const DEFAULT_TIMEOUT_MS = 30_000;
export class OpenAIProvider extends BaseProvider {
    id;
    name;
    capabilities;
    initialized = false;
    constructor(init) {
        const resolvedConfig = {
            ...init,
            providerName: init.id ?? OPENAI_DEFAULT_ID,
            baseUrl: init.baseUrl ?? OPENAI_DEFAULT_BASE_URL,
        };
        super(resolvedConfig);
        this.id = resolvedConfig.id ?? OPENAI_DEFAULT_ID;
        this.name = resolvedConfig.name ?? OPENAI_DEFAULT_NAME;
        this.capabilities =
            resolvedConfig.capabilities ?? OPENAI_DEFAULT_CAPABILITIES;
    }
    getCapabilities() {
        return toProviderCapabilities(this.capabilities, this.config.maxContextTokens);
    }
    getAuthHeaders() {
        if (!this.config.apiKey)
            return {};
        const headers = {
            Authorization: `Bearer ${this.config.apiKey}`,
        };
        if (this.config.organizationId) {
            headers["OpenAI-Organization"] = this.config.organizationId;
        }
        return headers;
    }
    /**
     * Idempotent registration-time hook. `Provider.initialize` receives the
     * registry's `ProviderConfig` shape (id/name/endpoint/apiKey/enabled/
     * priority/timeout) — distinct from the constructor's `ProviderConfig`
     * (providerName/baseUrl-centric, used to build the `HttpClient`). Since
     * `HttpClient` is already built and immutable by the time `initialize`
     * runs, this validates identity consistency rather than re-configuring
     * transport.
     */
    async initialize(config) {
        if (this.initialized)
            return;
        if (config.id !== this.id) {
            throw new ProviderError({
                code: ProviderErrorCode.VALIDATION,
                message: `OpenAIProvider instance id "${this.id}" does not match registration id "${config.id}"`,
                retryable: false,
                context: { providerName: this.id },
            });
        }
        if (config.enabled === false) {
            this.logger.warn(`${this.id}: initialized while registration config marks it disabled`, {
                providerName: this.id,
            });
        }
        this.initialized = true;
    }
    async health() {
        return this.healthCheck();
    }
    async healthCheck() {
        try {
            await this.execute("/models", {
                method: "GET",
                timeoutMs: HEALTH_CHECK_TIMEOUT_MS,
            });
            return true;
        }
        catch {
            return false;
        }
    }
    async chat(request) {
        const body = toOpenAIChatCompletionRequestBody(request, this.config);
        const response = await this.execute("/chat/completions", {
            method: "POST",
            body,
        });
        return fromOpenAIChatCompletionResponse(response.data, request.model);
    }
    /**
     * Streaming chat turn. Talks to `fetch` directly (see file header for
     * why) rather than through `BaseProvider.execute`/`HttpClient`.
     */
    async *chatStream(request) {
        const body = toOpenAIChatCompletionRequestBody(request, this.config);
        const requestBody = { ...body, stream: true };
        const url = this.buildUrl("/chat/completions");
        const timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
        const controller = new AbortController();
        const timeoutTimer = setTimeout(() => controller.abort(new ProviderTimeoutSignal(timeoutMs)), timeoutMs);
        const fetchImpl = this.config.fetchImpl ?? globalThis.fetch.bind(globalThis);
        const authHeaders = await this.getAuthHeaders();
        const headers = new Headers({ "content-type": "application/json" });
        for (const [key, value] of Object.entries(this.config.defaultHeaders ?? {})) {
            headers.set(key, value);
        }
        for (const [key, value] of Object.entries(authHeaders)) {
            headers.set(key, value);
        }
        let response;
        try {
            response = await fetchImpl(url, {
                method: "POST",
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal,
            });
        }
        catch (rawError) {
            clearTimeout(timeoutTimer);
            throw normalizeError(rawError, {
                providerName: this.id,
                method: "POST",
                url,
            });
        }
        if (!response.ok || !response.body) {
            clearTimeout(timeoutTimer);
            const errorPayload = await this.safeReadErrorBody(response);
            throw normalizeHttpErrorResponse({
                statusCode: response.status,
                statusText: response.statusText,
                body: errorPayload,
                context: { providerName: this.id, method: "POST", url },
            });
        }
        try {
            yield* this.parseSseStream(response.body);
        }
        finally {
            clearTimeout(timeoutTimer);
        }
    }
    buildUrl(path) {
        const base = (this.config.baseUrl ?? OPENAI_DEFAULT_BASE_URL).replace(/\/+$/, "");
        const normalizedPath = path.startsWith("/") ? path : `/${path}`;
        return `${base}${normalizedPath}`;
    }
    async safeReadErrorBody(response) {
        try {
            const text = await response.text();
            if (!text)
                return undefined;
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
    async *parseSseStream(body) {
        const reader = body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        try {
            for (;;) {
                const { done, value } = await reader.read();
                if (done)
                    break;
                buffer += decoder
                    .decode(value, { stream: true })
                    .replace(/\r\n/g, "\n");
                let boundary = buffer.indexOf("\n\n");
                while (boundary !== -1) {
                    const rawEvent = buffer.slice(0, boundary);
                    buffer = buffer.slice(boundary + 2);
                    const chunk = this.parseSseEvent(rawEvent);
                    if (chunk)
                        yield chunk;
                    boundary = buffer.indexOf("\n\n");
                }
            }
        }
        finally {
            reader.releaseLock();
        }
    }
    parseSseEvent(rawEvent) {
        for (const line of rawEvent.split("\n")) {
            if (!line.startsWith("data:"))
                continue;
            const payload = line.slice(5).trim();
            if (payload === "[DONE]") {
                return { delta: "", done: true };
            }
            try {
                const parsed = JSON.parse(payload);
                return fromOpenAIChunk(parsed);
            }
            catch (error) {
                throw new ProviderError({
                    code: ProviderErrorCode.SERIALIZATION,
                    message: `Failed to parse OpenAI stream chunk: ${error instanceof Error ? error.message : String(error)}`,
                    retryable: false,
                    context: { providerName: this.id },
                });
            }
        }
        return undefined;
    }
}
