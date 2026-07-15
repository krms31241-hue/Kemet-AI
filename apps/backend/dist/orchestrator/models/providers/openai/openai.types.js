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
import { ProviderError, ProviderErrorCode } from "../base/index.js";
export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
export const OPENAI_DEFAULT_ID = "openai";
export const OPENAI_DEFAULT_NAME = "OpenAI";
export const OPENAI_DEFAULT_CAPABILITIES = [
    "chat",
    "streaming",
    "tool-calling",
    "vision",
    "structured-output",
];
/** Bridges the provider-agnostic capability list to `BaseProvider`'s boolean-flag shape. */
export function toProviderCapabilities(capabilities, maxContextTokens) {
    return {
        streaming: capabilities.includes("streaming"),
        toolUse: capabilities.includes("tool-calling"),
        vision: capabilities.includes("vision"),
        ...(maxContextTokens !== undefined ? { maxContextTokens } : {}),
    };
}
function toOpenAIMessage(message) {
    return {
        role: message.role,
        content: message.content,
        ...(message.name ? { name: message.name } : {}),
    };
}
export function toOpenAIChatCompletionRequestBody(request, config) {
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
function fromOpenAIUsage(usage) {
    return {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
    };
}
export function fromOpenAIChatCompletionResponse(body, requestedModel) {
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
export function fromOpenAIChunk(chunk) {
    const choice = chunk.choices[0];
    if (!choice)
        return undefined;
    const finishReason = choice.finish_reason ?? undefined;
    return {
        delta: choice.delta.content ?? "",
        done: finishReason !== undefined,
        ...(finishReason ? { finishReason } : {}),
    };
}
