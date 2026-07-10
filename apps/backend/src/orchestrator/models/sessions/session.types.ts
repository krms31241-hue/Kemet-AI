/**
 * session.types.ts
 *
 * A `ModelSession` binds a conversation (tracked separately by
 * `ConversationContextManager`) to the provider/model currently serving
 * it, plus lifecycle status. Multiple sessions may share a project or
 * orchestrator-level workspace; that linkage is intentionally left as an
 * opaque `projectId` rather than importing orchestrator's `RuntimeContext`,
 * keeping this module independently testable.
 */

export type ModelSessionStatus = "active" | "idle" | "closed";

export interface ModelSession {
  readonly id: string;
  readonly projectId?: string;
  providerId: string;
  model: string;
  status: ModelSessionStatus;
  readonly systemPrompt?: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}

export interface CreateSessionInput {
  readonly projectId?: string;
  readonly providerId: string;
  readonly model: string;
  readonly systemPrompt?: string;
  readonly metadata?: Record<string, unknown>;
}

