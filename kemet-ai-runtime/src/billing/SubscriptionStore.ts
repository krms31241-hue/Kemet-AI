import type { Subscription } from './types.js';

export interface SubscriptionStore {
  save(subscription: Subscription): Promise<void>;
  findById(id: string): Promise<Subscription | undefined>;
  findByCustomer(customerId: string): Promise<readonly Subscription[]>;
  findDueForRenewal(asOf: Date): Promise<readonly Subscription[]>;
}

export class InMemorySubscriptionStore implements SubscriptionStore {
  private readonly byId = new Map<string, Subscription>();

  public async save(subscription: Subscription): Promise<void> {
    this.byId.set(subscription.id, { ...subscription });
  }

  public async findById(id: string): Promise<Subscription | undefined> {
    const found = this.byId.get(id);
    return found ? { ...found } : undefined;
  }

  public async findByCustomer(customerId: string): Promise<readonly Subscription[]> {
    return Array.from(this.byId.values())
      .filter((s) => s.customerId === customerId)
      .map((s) => ({ ...s }));
  }

  public async findDueForRenewal(asOf: Date): Promise<readonly Subscription[]> {
    return Array.from(this.byId.values())
      .filter((s) => s.status === 'active' && s.currentPeriodEnd <= asOf)
      .map((s) => ({ ...s }));
  }
}
