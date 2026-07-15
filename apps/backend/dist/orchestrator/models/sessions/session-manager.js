/**
 * session-manager.ts
 *
 * Owns the lifecycle of `ModelSession`s. Composes a
 * `ConversationContextManager` (dependency injected, defaulting to the
 * shared singleton) so creating or closing a session also creates or
 * clears its associated message history in one place, rather than
 * requiring every caller to remember to keep the two in sync.
 */
import { randomUUID } from "node:crypto";
import { conversationContextManager } from "../context/conversation-context-manager.js";
export class SessionManager {
    sessions = new Map();
    contextManager;
    constructor(contextManager = conversationContextManager) {
        this.contextManager = contextManager;
    }
    create(input) {
        const now = new Date();
        const session = {
            id: randomUUID(),
            projectId: input.projectId,
            providerId: input.providerId,
            model: input.model,
            status: "active",
            systemPrompt: input.systemPrompt,
            metadata: input.metadata ?? {},
            createdAt: now,
            updatedAt: now,
            lastActiveAt: now,
        };
        this.sessions.set(session.id, session);
        this.contextManager.getOrCreate(session.id, input.systemPrompt);
        return session;
    }
    get(sessionId) {
        return this.sessions.get(sessionId) ?? null;
    }
    getOrThrow(sessionId) {
        const session = this.get(sessionId);
        if (!session) {
            throw new RangeError(`No model session found for id "${sessionId}"`);
        }
        return session;
    }
    list() {
        return [...this.sessions.values()];
    }
    touch(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.lastActiveAt = new Date();
        session.updatedAt = session.lastActiveAt;
        return session;
    }
    setStatus(sessionId, status) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.status = status;
        session.updatedAt = new Date();
        return session;
    }
    rebind(sessionId, providerId, model) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        session.providerId = providerId;
        session.model = model;
        session.updatedAt = new Date();
        return session;
    }
    close(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        session.status = "closed";
        session.updatedAt = new Date();
        this.contextManager.clear(sessionId);
        return this.sessions.delete(sessionId);
    }
    clear() {
        for (const sessionId of this.sessions.keys()) {
            this.contextManager.clear(sessionId);
        }
        this.sessions.clear();
    }
}
export const sessionManager = new SessionManager();
