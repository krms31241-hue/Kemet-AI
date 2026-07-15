import { generateId } from '../core/ids.js';
import { ConflictError, NotFoundError, ValidationError } from '../core/errors.js';
import type { EventBus } from '../core/events/EventBus.js';
import type { Logger } from '../core/logging/Logger.js';
import type { PlanCatalog } from './PlanCatalog.js';
import type { SubscriptionStore } from './SubscriptionStore.js';
import type { InvoiceService } from './InvoiceService.js';
import { advancePeriod } from './period.js';
import type { Subscription } from './types.js';
import type { BillingEventMap } from './events.js';

export interface CreateSubscriptionInput {
  readonly customerId: string;
  readonly planId: string;
  readonly startAt?: Date;
}

export class SubscriptionManager {
  public constructor(
    private readonly store: SubscriptionStore,
    private readonly plans: PlanCatalog,
    private readonly invoices: InvoiceService,
    private readonly events: EventBus<BillingEventMap>,
    private readonly logger: Logger,
  ) {}

  public async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const plan = this.plans.get(input.planId);
    const start = input.startAt ?? new Date();
    const trialEnd = plan.trialDays
      ? new Date(start.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : undefined;
    const periodEnd = trialEnd ?? advancePeriod(start, plan.interval, plan.intervalCount);

    const subscription: Subscription = {
      id: generateId('sub'),
      customerId: input.customerId,
      planId: plan.id,
      status: trialEnd ? 'trialing' : 'active',
      currentPeriodStart: start,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: start,
    };

    await this.store.save(subscription);
    this.events.emit('subscription.created', { subscription });
    this.logger.info('subscription created', { subscriptionId: subscription.id, planId: plan.id });

    if (!trialEnd) {
      const invoice = await this.invoices.createForSubscription(subscription, plan, []);
      this.events.emit('invoice.created', { invoice });
    }

    return subscription;
  }

  public async cancel(subscriptionId: string, options: { immediately?: boolean } = {}): Promise<Subscription> {
    const subscription = await this.require(subscriptionId);
    if (subscription.status === 'canceled') {
      throw new ConflictError('Subscription already canceled', { subscriptionId });
    }

    if (options.immediately) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
    } else {
      subscription.cancelAtPeriodEnd = true;
    }

    await this.store.save(subscription);
    this.events.emit('subscription.canceled', { subscription });
    return subscription;
  }

  public async markPastDue(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.require(subscriptionId);
    subscription.status = 'past_due';
    await this.store.save(subscription);
    this.events.emit('subscription.past_due', { subscription });
    return subscription;
  }

  public async renewDue(asOf: Date = new Date()): Promise<readonly Subscription[]> {
    const due = await this.store.findDueForRenewal(asOf);
    const processed: Subscription[] = [];

    for (const subscription of due) {
      const plan = this.plans.get(subscription.planId);

      if (subscription.cancelAtPeriodEnd) {
        subscription.status = 'canceled';
        subscription.canceledAt = asOf;
        await this.store.save(subscription);
        this.events.emit('subscription.canceled', { subscription });
        processed.push(subscription);
        continue;
      }

      const newPeriodStart = subscription.currentPeriodEnd;
      const newPeriodEnd = advancePeriod(newPeriodStart, plan.interval, plan.intervalCount);
      subscription.currentPeriodEnd = newPeriodEnd;
      subscription.status = 'active';

      await this.store.save(subscription);
      const invoice = await this.invoices.createForSubscription(subscription, plan, []);
      this.events.emit('subscription.renewed', { subscription, invoice });
      processed.push(subscription);
    }

    return processed;
  }

  private async require(subscriptionId: string): Promise<Subscription> {
    const subscription = await this.store.findById(subscriptionId);
    if (!subscription) throw new NotFoundError('Subscription', subscriptionId);
    if (typeof subscription.customerId !== 'string' || subscription.customerId.length === 0) {
      throw new ValidationError('Corrupt subscription record missing customerId', { subscriptionId });
    }
    return subscription;
  }
}
