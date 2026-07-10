/**
 * model-event-bus.ts
 *
 * Type-safe facade over the orchestrator's shared {@link EventBus} scoped
 * to model-runtime events. Reuses the existing `EventBus` implementation
 * (composition, not reinvention) while giving callers compile-time checked
 * event names and payloads via {@link ModelEventPayloadMap}.
 */

import { EventBus, type EventListener, type RuntimeEvent } from "../../events/event-bus.js";
import type { ModelEventPayloadMap, ModelEventType } from "./model-events.types.js";

export type ModelEventListener<K extends ModelEventType> = (
  event: RuntimeEvent<ModelEventPayloadMap[K]>,
) => void | Promise<void>;

/**
 * Dedicated event bus instance for the model subsystem. Kept separate from
 * the orchestrator-wide `eventBus` singleton so model-level event volume
 * (potentially one `model.stream.chunk` per token) never crowds out
 * workflow/task events, while still reusing the exact same `EventBus`
 * class and semantics.
 */
export class ModelEventBus {
  private readonly bus: EventBus;

  constructor(bus: EventBus = new EventBus()) {
    this.bus = bus;
  }

  public on<K extends ModelEventType>(type: K, listener: ModelEventListener<K>): void {
    this.bus.on(type, listener as EventListener);
  }

  public off<K extends ModelEventType>(type: K, listener: ModelEventListener<K>): void {
    this.bus.off(type, listener as EventListener);
  }

  public async emit<K extends ModelEventType>(type: K, payload: ModelEventPayloadMap[K]): Promise<void> {
    await this.bus.emit(type, payload);
  }

  public clear(): void {
    this.bus.clear();
  }
}

export const modelEventBus = new ModelEventBus();

