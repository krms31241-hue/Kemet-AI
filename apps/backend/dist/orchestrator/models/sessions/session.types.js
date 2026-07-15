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
export {};
