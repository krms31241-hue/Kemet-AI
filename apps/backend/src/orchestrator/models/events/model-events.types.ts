/**
 * model-events.types.ts
 *
 * Typed event taxonomy emitted by the AI Runtime model subsystem
 * (router, runtime, cache, streaming, usage). Consumers subscribe through
 * {@link ModelEventBus} using these literal type names to get compile-time
 * checked payloads instead of stringly-typed event names.
 */

import type { ChatRequest, ChatResponse, ProviderUsage } from "../providers/provider.types.js";

export interface ModelRequestStartedPayload {
  readonly sessionId: string;
  readonly providerId: string;
  readonly model: string;
  readonly request: ChatRequest;
}

export interface ModelRequestSucceededPayload {
  readonly sessionId: string;
  readonly providerId: string;
  readonly model: string;
  readonly response: ChatResponse;
  readonly durationMs: number;
  readonly cached: boolean;
}

export interface ModelRequestFailedPayload {
  readonly sessionId: string;
  readonly providerId: string;
  readonly model: string;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly retryable: boolean;
  readonly durationMs: number;
}

export interface ModelRetryPayload {
  readonly sessionId: string;
  readonly providerId: string;
  readonly attempt: number;
  readonly delayMs: number;
  readonly reason: string;
}

export interface ModelStreamChunkPayload {
  readonly sessionId: string;
  readonly providerId: string;
  readonly model: string;
  readonly delta: string;
  readonly done: boolean;
}

export interface ModelCacheHitPayload {
  readonly sessionId: string;
  readonly cacheKey: string;
}

export interface ModelCacheMissPayload {
  readonly sessionId: string;
  readonly cacheKey: string;
}

export interface ModelUsageRecordedPayload {
  readonly sessionId: string;
  readonly providerId: string;
  readonly model: string;
  readonly usage: ProviderUsage;
}

export interface ModelRoutedPayload {
  readonly sessionId: string;
  readonly providerId: string;
  readonly model: string;
  readonly strategy: string;
  readonly reason: string;
}

/**
 * Map from event type literal to its payload shape. `keyof` this map is
 * the exhaustive set of model-runtime event names.
 */
export interface ModelEventPayloadMap {
  "model.request.started": ModelRequestStartedPayload;
  "model.request.succeeded": ModelRequestSucceededPayload;
  "model.request.failed": ModelRequestFailedPayload;
  "model.retry": ModelRetryPayload;
  "model.stream.chunk": ModelStreamChunkPayload;
  "model.cache.hit": ModelCacheHitPayload;
  "model.cache.miss": ModelCacheMissPayload;
  "model.usage.recorded": ModelUsageRecordedPayload;
  "model.routed": ModelRoutedPayload;
}

export type ModelEventType = keyof ModelEventPayloadMap;

