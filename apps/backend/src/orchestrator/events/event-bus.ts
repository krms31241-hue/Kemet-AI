export interface RuntimeEvent<T = unknown> {
  type: string;

  payload: T;

  timestamp: Date;
}

export type EventListener<T = unknown> = (
  event: RuntimeEvent<T>,
) => void | Promise<void>;

export class EventBus {
  private readonly listeners =
    new Map<
      string,
      Set<EventListener>
    >();

  on(
    type: string,
    listener: EventListener,
  ) {
    if (!this.listeners.has(type)) {
      this.listeners.set(
        type,
        new Set(),
      );
    }

    this.listeners
      .get(type)!
      .add(listener);
  }

  off(
    type: string,
    listener: EventListener,
  ) {
    this.listeners
      .get(type)
      ?.delete(listener);
  }

  async emit<T>(
    type: string,
    payload: T,
  ) {
    const event: RuntimeEvent<T> = {
      type,
      payload,
      timestamp: new Date(),
    };

    const listeners =
      this.listeners.get(type);

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

export const eventBus =
  new EventBus();
