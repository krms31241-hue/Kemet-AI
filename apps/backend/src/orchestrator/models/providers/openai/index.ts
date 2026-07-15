/**
 * index.ts
 *
 * Public surface of the OpenAI provider. Not currently re-exported from
 * `providers/index.ts` or `models/index.ts` (neither was modified as
 * part of this change) — consumers import directly from this barrel:
 * `orchestrator/models/providers/openai/index.js`.
 */

export { OpenAIProvider } from "./openai-provider.js";

export {
  OPENAI_DEFAULT_BASE_URL,
  OPENAI_DEFAULT_CAPABILITIES,
  OPENAI_DEFAULT_ID,
  OPENAI_DEFAULT_MODEL,
  OPENAI_DEFAULT_NAME,
  toProviderCapabilities,
  toOpenAIChatCompletionRequestBody,
  fromOpenAIChatCompletionResponse,
  fromOpenAIChunk,
  type OpenAIProviderConfig,
  type OpenAIProviderInit,
  type OpenAIChatMessage,
  type OpenAIChatCompletionRequestBody,
  type OpenAIChatCompletionResponseBody,
  type OpenAIChatCompletionChoice,
  type OpenAIChatCompletionChunk,
  type OpenAIChatCompletionChunkChoice,
  type OpenAIUsage,
  type OpenAIErrorResponseBody,
} from "./openai.types.js";
