/**
 * openai.types.ts
 *
 * OpenAI-specific configuration and wire-format types, plus pure
 * translation functions between the orchestrator's provider-agnostic
 * `ChatRequest`/`ChatResponse`/`StreamChunk` shapes and OpenAI's Chat
 * Completions API request/response bodies. Kept free of any networking
 * or class state so these mappings are trivially unit-testable in
 * isolation from `OpenAIProvider`.
 */

import type {
  ProviderConfig as BaseProviderConfig,
  ProviderCapabilities,
} from "../base/index.js";
import { ProviderError, ProviderErrorCode } from "../base/index.js";
import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ProviderCapability,
  ProviderUsage,
} from "../provider.types.js";
import type { StreamChunk } from "../../streaming/streaming.types.js";

/**
 * Configuration accepted internally once resolved. Extends the provider
 * foundation's `ProviderConfig` (from `base-provider.ts`) as-is —
 * `providerName` and `baseUrl` stay required there so the
 * `BaseProvider<TConfig>` generic bound is satisfied without
 * modification. Callers construct via `OpenAIProvider`, which accepts the
 * more permissive `OpenAIProviderInit` (see below) and derives both
 * `providerName` and `baseUrl` before ever calling into `BaseProvider`.
 */
export interface OpenAIProviderConfig extends BaseProviderConfig {
  readonly id?: string;
  readonly name?: string;
  /** Sent as the `OpenAI-Organization` header when present. */
  readonly organizationId?: string;
  /** Used when a `ChatRequest` omits `model`. */
  readonly defaultModel?: string;
  /** Overrides the default capability list this provider advertises. */
  readonly capabilities?: readonly ProviderCapability[];
  readonly maxContextTokens?: number;
}

/**
 * Public-facing constructor input: `OpenAIProviderConfig` minus the two
 * fields `OpenAIProvider`'s constructor derives internally —
 * `providerName` (from `id`) and `baseUrl` (defaulted to the OpenAI API).
 * Callers never need to supply either.
 */
export type OpenAIProviderInit = Omit<
  OpenAIProviderConfig,
  "baseUrl" | "providerName"
> & {
  readonly baseUrl?: string;
};

export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
export const OPENAI_DEFAULT_ID = "openai";
export const OPENAI_DEFAULT_NAME = "OpenAI";

export const OPENAI_DEFAULT_CAPABILITIES: readonly ProviderCapability[] = [
  "chat",
  "streaming",
  "tool-calling",
  "vision",
  "structured-output",
];

/** Bridges the provider-agnostic capability list to `BaseProvider`'s boolean-flag shape. */
export function toProviderCapabilities(
  capabilities: readonly ProviderCapability[],
  maxContextTokens?: number,
): ProviderCapabilities {
  return {
    streaming: capabilities.includes("streaming"),
    toolUse: capabilities.includes("tool-calling"),
    vision: capabilities.includes("vision"),
    ...(maxContextTokens !== undefined ? { maxContextTokens } : {}),
  };
}

export interface OpenAIChatMessage {
  readonly role: "system" | "user" | "assistant" | "tool";
  readonly content: string;
  readonly name?: string;
}

export interface OpenAIChatCompletionRequestBody {
  readonly model: string;
  readonly messages: readonly OpenAIChatMessage[];
  readonly temperature?: number;
  readonly max_tokens?: number;
  readonly stream?: boolean;
}

export interface OpenAIUsage {
  readonly prompt_tokens: number;
  readonly completion_tokens: number;
  readonly total_tokens: number;
}

export interface OpenAIChatCompletionChoice {
  readonly index: number;
  readonly message: OpenAIChatMessage;
  readonly finish_reason: string | null;
}

export interface OpenAIChatCompletionResponseBody {
  readonly id: string;
  readonly object: string;
  readonly created: number;
  readonly model: string;
  readonly choices: readonly OpenAIChatCompletionChoice[];
  readonly usage?: OpenAIUsage;
}

export interface OpenAIChatCompletionChunkChoice {
  readonly index: number;
  readonly delta: { readonly role?: string; readonly content?: string };
  readonly finish_reason: string | null;
}

export interface OpenAIChatCompletionChunk {
  readonly id: string;
  readonly object: string;
  readonly created: number;
  readonly model: string;
  readonly choices: readonly OpenAIChatCompletionChunkChoice[];
}

export interface OpenAIErrorResponseBody {
  readonly error: {
    readonly message: string;
    readonly type?: string;
    readonly code?: string | null;
  };
}

function toOpenAIMessage(message: ChatMessage): OpenAIChatMessage {
  return {
    role: message.role,
    content: message.content,
    ...(message.name ? { name: message.name } : {}),
  };
}

export function toOpenAIChatCompletionRequestBody(
  request: ChatRequest,
  config: Pick<OpenAIProviderConfig, "defaultModel">,
): OpenAIChatCompletionRequestBody {
  return {
    model: request.model || config.defaultModel || OPENAI_DEFAULT_MODEL,
    messages: request.messages.map(toOpenAIMessage),
    ...(request.temperature !== undefined
      ? { temperature: request.temperature }
      : {}),
    ...(request.maxTokens !== undefined
      ? { max_tokens: request.maxTokens }
      : {}),
    ...(request.stream !== undefined ? { stream: request.stream } : {}),
  };
}

function fromOpenAIUsage(usage: OpenAIUsage): ProviderUsage {
  return {
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
  };
}

export function fromOpenAIChatCompletionResponse(
  body: OpenAIChatCompletionResponseBody,
  requestedModel: string,
): ChatResponse {
  const choice = body.choices[0];
  if (!choice) {
    throw new ProviderError({
      code: ProviderErrorCode.SERIALIZATION,
      message: "OpenAI chat completion response contained no choices",
      retryable: false,
      context: { providerName: OPENAI_DEFAULT_ID },
    });
  }

  return {
    id: body.id,
    model: body.model || requestedModel,
    message: {
      role: choice.message.role,
      content: choice.message.content ?? "",
    },
    ...(body.usage ? { usage: fromOpenAIUsage(body.usage) } : {}),
  };
}

/** Maps a single SSE chunk to a `StreamChunk`, or `undefined` if the chunk carries no choices. */
export function fromOpenAIChunk(
  chunk: OpenAIChatCompletionChunk,
): StreamChunk | undefined {
  const choice = chunk.choices[0];
  if (!choice) return undefined;

  const finishReason = choice.finish_reason ?? undefined;
  return {
    delta: choice.delta.content ?? "",
    done: finishReason !== undefined,
    ...(finishReason ? { finishReason } : {}),
  };
}
