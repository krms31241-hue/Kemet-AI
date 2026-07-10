/**
 * conversation-context.types.ts
 *
 * Conversation-scoped message history for the model runtime. Distinct
 * from the orchestrator-level `RuntimeContext` (workspace/project/session
 * variables in `orchestrator/context/context-manager.ts`): this context is
 * specifically the rolling window of `ChatMessage`s sent to a provider.
 */

import type { ChatMessage } from "../providers/provider.types.js";

export interface ConversationContext {
  readonly sessionId: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  updatedAt: Date;
}

export interface ConversationContextOptions {
  /** Soft cap on estimated tokens retained in the window. Default 8_000. */
  readonly maxTokens?: number;
  /** Hard cap on number of messages retained regardless of token estimate. Default 100. */
  readonly maxMessages?: number;
}

