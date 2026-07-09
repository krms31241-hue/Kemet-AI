export interface RuntimeContext {
  sessionId: string;

  projectId: string;

  workspace: string;

  variables: Record<string, unknown>;

  metadata: Record<string, unknown>;

  createdAt: Date;

  updatedAt: Date;
}

export class ContextManager {
  private readonly contexts =
    new Map<string, RuntimeContext>();

  create(
    context: Omit<
      RuntimeContext,
      "createdAt" | "updatedAt"
    >,
  ) {
    const entity: RuntimeContext = {
      ...context,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contexts.set(
      entity.sessionId,
      entity,
    );

    return entity;
  }

  get(sessionId: string) {
    return (
      this.contexts.get(sessionId) ?? null
    );
  }

  update(
    sessionId: string,
    data: Partial<
      Omit<
        RuntimeContext,
        "sessionId" | "createdAt"
      >
    >,
  ) {
    const current =
      this.contexts.get(sessionId);

    if (!current) {
      return null;
    }

    const updated: RuntimeContext = {
      ...current,
      ...data,
      updatedAt: new Date(),
    };

    this.contexts.set(
      sessionId,
      updated,
    );

    return updated;
  }

  delete(sessionId: string) {
    return this.contexts.delete(
      sessionId,
    );
  }

  list() {
    return [...this.contexts.values()];
  }

  clear() {
    this.contexts.clear();
  }
}

export const contextManager =
  new ContextManager();
