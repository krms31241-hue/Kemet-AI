/**
 * conversation-context-manager.ts
 *
 * Owns the per-session rolling window of chat messages sent to providers,
 * applying a token-budget-aware truncation strategy so long-running
 * sessions never silently exceed a model's context window.
 */
const DEFAULT_MAX_TOKENS = 8_000;
const DEFAULT_MAX_MESSAGES = 100;
/**
 * Cheap, dependency-free token estimate (~4 characters per token, the
 * commonly cited heuristic for English text across GPT/Claude-family
 * tokenizers). Deliberately conservative for budgeting purposes; exact
 * tokenization is provider-specific and out of scope for this layer.
 */
export function estimateTokens(text) {
    return Math.ceil(text.length / 4);
}
function estimateMessageTokens(message) {
    // +4 accounts for role/name framing overhead per message, consistent
    // with common chat-format token accounting conventions.
    return estimateTokens(message.content) + 4;
}
export class ConversationContextManager {
    contexts = new Map();
    maxTokens;
    maxMessages;
    constructor(options = {}) {
        this.maxTokens = options.maxTokens ?? DEFAULT_MAX_TOKENS;
        this.maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES;
        if (this.maxTokens <= 0) {
            throw new RangeError("ConversationContextOptions.maxTokens must be > 0");
        }
        if (this.maxMessages <= 0) {
            throw new RangeError("ConversationContextOptions.maxMessages must be > 0");
        }
    }
    create(sessionId, systemPrompt) {
        const now = new Date();
        const context = {
            sessionId,
            messages: [],
            systemPrompt,
            metadata: {},
            createdAt: now,
            updatedAt: now,
        };
        this.contexts.set(sessionId, context);
        return context;
    }
    get(sessionId) {
        return this.contexts.get(sessionId) ?? null;
    }
    getOrCreate(sessionId, systemPrompt) {
        return this.get(sessionId) ?? this.create(sessionId, systemPrompt);
    }
    appendMessage(sessionId, message) {
        const context = this.getOrCreate(sessionId);
        context.messages.push(message);
        context.updatedAt = new Date();
        this.truncate(context);
        return context;
    }
    appendMessages(sessionId, messages) {
        const context = this.getOrCreate(sessionId);
        context.messages.push(...messages);
        context.updatedAt = new Date();
        this.truncate(context);
        return context;
    }
    /**
     * Builds the exact message array to send to a provider: the system
     * prompt (if any) prepended to the current truncated message window.
     */
    buildRequestMessages(sessionId) {
        const context = this.get(sessionId);
        if (!context) {
            return [];
        }
        const systemMessage = context.systemPrompt
            ? [{ role: "system", content: context.systemPrompt }]
            : [];
        return [...systemMessage, ...context.messages];
    }
    clear(sessionId) {
        return this.contexts.delete(sessionId);
    }
    estimateTokenUsage(sessionId) {
        const context = this.get(sessionId);
        if (!context) {
            return 0;
        }
        const systemTokens = context.systemPrompt ? estimateTokens(context.systemPrompt) + 4 : 0;
        return systemTokens + context.messages.reduce((sum, message) => sum + estimateMessageTokens(message), 0);
    }
    /**
     * Drops the oldest non-system messages first until both the message
     * count and estimated token budget are within configured limits. The
     * system prompt itself is never truncated, since it defines the
     * assistant's behavior for the whole session.
     */
    truncate(context) {
        while (context.messages.length > this.maxMessages) {
            context.messages.shift();
        }
        const systemTokens = context.systemPrompt ? estimateTokens(context.systemPrompt) + 4 : 0;
        let total = systemTokens + context.messages.reduce((sum, message) => sum + estimateMessageTokens(message), 0);
        while (total > this.maxTokens && context.messages.length > 0) {
            const removed = context.messages.shift();
            if (!removed) {
                break;
            }
            total -= estimateMessageTokens(removed);
        }
    }
}
export const conversationContextManager = new ConversationContextManager();
