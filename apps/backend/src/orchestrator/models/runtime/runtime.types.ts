/**
 * runtime.types.ts
 *
 * Public request/result shapes for `ModelRuntime`, the top-level
 * orchestration entry point that ties routing, sessions, conversation
 * context, caching, and usage tracking together around a provider call.
 */

import type { ChatMessage, ChatResponse, ProviderCapability } from "../providers/provider.types.js";
import type { RoutingStrategy } from "../router/router.types.js";

export interface RuntimeChatInput {
  /** Existing session to continue. Omit to start a new session. */
  readonly sessionId?: string;
  readonly projectId?: string;
  /** Pin the request to a specific provider id, bypassing strategy-based routing. */
  readonly providerId?: string;
  readonly model: string;
  /** The new user turn. A bare string is treated as `{ role: "user", content: message }`. */
  readonly message: ChatMessage | string;
  readonly requiredCapabilities?: readonly ProviderCapability[];
  readonly strategy?: RoutingStrategy;
  /** System prompt applied only when a new session is created. Ignored for existing sessions. */
  readonly systemPrompt?: string;
  /** Whether to consult/populate the response cache. Ignored (treated as false) for streaming requests. Default true. */
  readonly useCache?: boolean;
}

export interface RuntimeChatResult {
  readonly sessionId: string;
  readonly providerId: string;
  readonly response: ChatResponse;
  readonly cached: boolean;
  readonly durationMs: number;
  readonly attempts: number;
}

