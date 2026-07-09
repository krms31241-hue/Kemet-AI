export class ContextManager {
    contexts = new Map();
    create(context) {
        const entity = {
            ...context,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.contexts.set(entity.sessionId, entity);
        return entity;
    }
    get(sessionId) {
        return (this.contexts.get(sessionId) ?? null);
    }
    update(sessionId, data) {
        const current = this.contexts.get(sessionId);
        if (!current) {
            return null;
        }
        const updated = {
            ...current,
            ...data,
            updatedAt: new Date(),
        };
        this.contexts.set(sessionId, updated);
        return updated;
    }
    delete(sessionId) {
        return this.contexts.delete(sessionId);
    }
    list() {
        return [...this.contexts.values()];
    }
    clear() {
        this.contexts.clear();
    }
}
export const contextManager = new ContextManager();
