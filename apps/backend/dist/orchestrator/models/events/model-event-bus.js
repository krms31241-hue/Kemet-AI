/**
 * model-event-bus.ts
 *
 * Type-safe facade over the orchestrator's shared {@link EventBus} scoped
 * to model-runtime events. Reuses the existing `EventBus` implementation
 * (composition, not reinvention) while giving callers compile-time checked
 * event names and payloads via {@link ModelEventPayloadMap}.
 */
import { EventBus } from "../../events/event-bus.js";
/**
 * Dedicated event bus instance for the model subsystem. Kept separate from
 * the orchestrator-wide `eventBus` singleton so model-level event volume
 * (potentially one `model.stream.chunk` per token) never crowds out
 * workflow/task events, while still reusing the exact same `EventBus`
 * class and semantics.
 */
export class ModelEventBus {
    bus;
    constructor(bus = new EventBus()) {
        this.bus = bus;
    }
    on(type, listener) {
        this.bus.on(type, listener);
    }
    off(type, listener) {
        this.bus.off(type, listener);
    }
    async emit(type, payload) {
        await this.bus.emit(type, payload);
    }
    clear() {
        this.bus.clear();
    }
}
export const modelEventBus = new ModelEventBus();
