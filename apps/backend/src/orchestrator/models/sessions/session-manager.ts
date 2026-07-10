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

import { conversationContextManager, type ConversationContextManager } from "../context/conversation-context-manager.js";
import type { CreateSessionInput, ModelSession } from "./session.types.js";

export class SessionManager {
  private readonly sessions = new Map<string, ModelSession>();
  private readonly contextManager: ConversationContextManager;

  constructor(contextManager: ConversationContextManager = conversationContextManager) {
    this.contextManager = contextManager;
  }

  public create(input: CreateSessionInput): ModelSession {
    const now = new Date();
    const session: ModelSession = {
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

  public get(sessionId: string): ModelSession | null {
    return this.sessions.get(sessionId) ?? null;
  }

  public getOrThrow(sessionId: string): ModelSession {
    const session = this.get(sessionId);
    if (!session) {
      throw new RangeError(`No model session found for id "${sessionId}"`);
    }
    return session;
  }

  public list(): ModelSession[] {
    return [...this.sessions.values()];
  }

  public touch(sessionId: string): ModelSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    session.lastActiveAt = new Date();
    session.updatedAt = session.lastActiveAt;
    return session;
  }

  public setStatus(sessionId: string, status: ModelSession["status"]): ModelSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    session.status = status;
    session.updatedAt = new Date();
    return session;
  }

  public rebind(sessionId: string, providerId: string, model: string): ModelSession | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }
    session.providerId = providerId;
    session.model = model;
    session.updatedAt = new Date();
    return session;
  }

  public close(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    session.status = "closed";
    session.updatedAt = new Date();
    this.contextManager.clear(sessionId);
    return this.sessions.delete(sessionId);
  }

  public clear(): void {
    for (const sessionId of this.sessions.keys()) {
      this.contextManager.clear(sessionId);
    }
    this.sessions.clear();
  }
}

export const sessionManager = new SessionManager();

