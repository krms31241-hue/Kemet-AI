/**
 * model-runtime.ts
 *
 * Top-level orchestration for a single chat turn: routes to a provider,
 * manages the session and its conversation context, consults the response
 * cache, executes the provider call with retry, records usage, and emits
 * lifecycle events. This is the seam application code (HTTP controllers,
 * websocket handlers) is expected to call rather than talking to routers
 * or providers directly.
 */
import { normalizeError, ProviderError, ProviderErrorCode } from "../providers/base/index.js";
import { ExponentialBackoffRetryPolicy, delay } from "../providers/base/index.js";
import { modelRouter } from "../router/model-router.js";
import { sessionManager } from "../sessions/session-manager.js";
import { conversationContextManager } from "../context/conversation-context-manager.js";
import { ResponseCache, buildCacheKey } from "../cache/response-cache.js";
import { usageTracker } from "../usage/usage-tracker.js";
import { modelEventBus } from "../events/model-event-bus.js";
import { streamAggregator } from "../streaming/stream-aggregator.js";
import { isStreamingCapable } from "../streaming/streaming.types.js";
export class ModelRuntime {
    router;
    sessions;
    context;
    cache;
    usage;
    events;
    streaming;
    retryPolicy;
    constructor(deps = {}) {
        this.router = deps.router ?? modelRouter;
        this.sessions = deps.sessions ?? sessionManager;
        this.context = deps.context ?? conversationContextManager;
        this.cache = deps.cache ?? new ResponseCache();
        this.usage = deps.usage ?? usageTracker;
        this.events = deps.events ?? modelEventBus;
        this.streaming = deps.streaming ?? streamAggregator;
        this.retryPolicy = deps.retryPolicy ?? new ExponentialBackoffRetryPolicy();
    }
    /** Executes a single non-streaming chat turn, returning the full response. */
    async chat(input) {
        const startedAt = Date.now();
        const prepared = this.prepareTurn(input, false);
        const { session, decision, chatRequest, cacheKey } = prepared;
        const useCache = input.useCache ?? true;
        if (useCache) {
            const cached = this.cache.get(cacheKey);
            if (cached) {
                await this.events.emit("model.cache.hit", { sessionId: session.id, cacheKey });
                this.context.appendMessage(session.id, cached.message);
                this.sessions.touch(session.id);
                return {
                    sessionId: session.id,
                    providerId: decision.provider.id,
                    response: cached,
                    cached: true,
                    durationMs: Date.now() - startedAt,
                    attempts: 0,
                };
            }
            await this.events.emit("model.cache.miss", { sessionId: session.id, cacheKey });
        }
        await this.events.emit("model.request.started", {
            sessionId: session.id,
            providerId: decision.provider.id,
            model: input.model,
            request: chatRequest,
        });
        const { response, attempts } = await this.executeWithRetry(decision.provider, chatRequest, session.id);
        const durationMs = Date.now() - startedAt;
        await this.events.emit("model.request.succeeded", {
            sessionId: session.id,
            providerId: decision.provider.id,
            model: input.model,
            response,
            durationMs,
            cached: false,
        });
        this.finalizeResponse(session, decision, response);
        if (useCache) {
            this.cache.set(cacheKey, response);
        }
        return {
            sessionId: session.id,
            providerId: decision.provider.id,
            response,
            cached: false,
            durationMs,
            attempts,
        };
    }
    /**
     * Executes a single streaming chat turn. `onChunk` is invoked for every
     * incremental chunk as it arrives; the returned promise resolves with
     * the fully aggregated response once the stream completes. Streaming
     * turns bypass the response cache in both directions (never read from
     * it, never populate it) since partial-token caching is not meaningful.
     */
    async streamChat(input, onChunk) {
        const startedAt = Date.now();
        const prepared = this.prepareTurn(input, true);
        const { session, decision, chatRequest } = prepared;
        if (!isStreamingCapable(decision.provider)) {
            throw new ProviderError({
                code: ProviderErrorCode.VALIDATION,
                message: `Provider "${decision.provider.id}" does not support streaming`,
                retryable: false,
                context: { providerName: decision.provider.id },
            });
        }
        await this.events.emit("model.request.started", {
            sessionId: session.id,
            providerId: decision.provider.id,
            model: input.model,
            request: chatRequest,
        });
        const stream = decision.provider.chatStream(chatRequest);
        const { response } = await this.streaming.aggregate(input.model, stream, async (chunk) => {
            await this.events.emit("model.stream.chunk", {
                sessionId: session.id,
                providerId: decision.provider.id,
                model: input.model,
                delta: chunk.delta,
                done: chunk.done,
            });
            if (onChunk) {
                await onChunk(chunk);
            }
        });
        const durationMs = Date.now() - startedAt;
        await this.events.emit("model.request.succeeded", {
            sessionId: session.id,
            providerId: decision.provider.id,
            model: input.model,
            response,
            durationMs,
            cached: false,
        });
        this.finalizeResponse(session, decision, response);
        return {
            sessionId: session.id,
            providerId: decision.provider.id,
            response,
            cached: false,
            durationMs,
            attempts: 1,
        };
    }
    /** Ends a session and releases its conversation context. */
    endSession(sessionId) {
        return this.sessions.close(sessionId);
    }
    prepareTurn(input, streaming) {
        const requiredCapabilities = input.requiredCapabilities ?? (streaming ? ["chat", "streaming"] : ["chat"]);
        let session;
        let decision;
        if (input.sessionId) {
            session = this.sessions.getOrThrow(input.sessionId);
            decision = this.router.select({ requiredCapabilities, providerId: input.providerId ?? session.providerId, model: input.model }, input.strategy ?? "priority");
            this.sessions.rebind(session.id, decision.provider.id, input.model);
        }
        else {
            decision = this.router.select({ requiredCapabilities, providerId: input.providerId, model: input.model }, input.strategy ?? "priority");
            session = this.sessions.create({
                projectId: input.projectId,
                providerId: decision.provider.id,
                model: input.model,
                systemPrompt: input.systemPrompt,
            });
        }
        const userMessage = typeof input.message === "string" ? { role: "user", content: input.message } : input.message;
        this.context.appendMessage(session.id, userMessage);
        const chatRequest = {
            model: input.model,
            messages: this.context.buildRequestMessages(session.id),
            stream: streaming,
        };
        const cacheKey = buildCacheKey(decision.provider.id, input.model, chatRequest);
        return { session, decision, chatRequest, cacheKey };
    }
    finalizeResponse(session, decision, response) {
        this.context.appendMessage(session.id, response.message);
        this.sessions.touch(session.id);
        if (response.usage) {
            this.usage.record({
                sessionId: session.id,
                providerId: decision.provider.id,
                model: session.model,
                usage: response.usage,
            });
            void this.events.emit("model.usage.recorded", {
                sessionId: session.id,
                providerId: decision.provider.id,
                model: session.model,
                usage: response.usage,
            });
        }
    }
    async executeWithRetry(provider, request, sessionId) {
        let attempt = 0;
        for (;;) {
            attempt += 1;
            try {
                const response = await provider.chat(request);
                return { response, attempts: attempt };
            }
            catch (rawError) {
                const error = normalizeError(rawError, { providerName: provider.id, model: request.model, attempt });
                await this.events.emit("model.request.failed", {
                    sessionId,
                    providerId: provider.id,
                    model: request.model,
                    errorCode: error.code,
                    errorMessage: error.message,
                    retryable: error.retryable,
                    durationMs: 0,
                });
                const willRetry = this.retryPolicy.shouldRetry(error, attempt);
                if (!willRetry) {
                    throw error;
                }
                const delayMs = this.retryPolicy.getDelayMs(attempt);
                await this.events.emit("model.retry", {
                    sessionId,
                    providerId: provider.id,
                    attempt,
                    delayMs,
                    reason: error.message,
                });
                await delay(delayMs);
            }
        }
    }
}
export const modelRuntime = new ModelRuntime();
