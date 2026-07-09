export class EventBus {
    listeners = new Map();
    on(type, listener) {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, new Set());
        }
        this.listeners
            .get(type)
            .add(listener);
    }
    off(type, listener) {
        this.listeners
            .get(type)
            ?.delete(listener);
    }
    async emit(type, payload) {
        const event = {
            type,
            payload,
            timestamp: new Date(),
        };
        const listeners = this.listeners.get(type);
        if (!listeners) {
            return;
        }
        for (const listener of listeners) {
            await listener(event);
        }
    }
    clear() {
        this.listeners.clear();
    }
}
export const eventBus = new EventBus();
