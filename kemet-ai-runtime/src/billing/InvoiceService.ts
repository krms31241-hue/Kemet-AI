import { generateId } from '../core/ids.js';
import { NotFoundError, ValidationError } from '../core/errors.js';
import { Money } from '../core/money.js';
import type { EventBus } from '../core/events/EventBus.js';
import type { InvoiceStore } from './InvoiceStore.js';
import type { Invoice, InvoiceLineItem, Plan, Subscription, UsageRecord } from './types.js';
import type { BillingEventMap } from './events.js';

export class InvoiceService {
  public constructor(
    private readonly store: InvoiceStore,
    private readonly events: EventBus<BillingEventMap>,
  ) {}

  public async createForSubscription(
    subscription: Subscription,
    plan: Plan,
    usage: readonly UsageRecord[],
  ): Promise<Invoice> {
    const lineItems: InvoiceLineItem[] = [
      {
        description: `${plan.name} (${plan.interval})`,
        quantity: 1,
        unitAmount: plan.price,
        amount: plan.price,
      },
      ...this.buildOverageLineItems(plan, usage),
    ];

    const total = lineItems.reduce(
      (sum, item) => sum.add(item.amount),
      Money.zero(plan.price.currency),
    );

    const invoice: Invoice = {
      id: generateId('inv'),
      customerId: subscription.customerId,
      subscriptionId: subscription.id,
      status: 'open',
      lineItems,
      currency: plan.price.currency,
      total,
      periodStart: subscription.currentPeriodStart,
      periodEnd: subscription.currentPeriodEnd,
      createdAt: new Date(),
    };

    await this.store.save(invoice);
    this.events.emit('invoice.created', { invoice });
    return invoice;
  }

  public async createAdHoc(
    customerId: string,
    currency: string,
    lineItems: readonly InvoiceLineItem[],
  ): Promise<Invoice> {
    if (lineItems.length === 0) {
      throw new ValidationError('Ad-hoc invoice requires at least one line item');
    }
    const total = lineItems.reduce((sum, item) => sum.add(item.amount), Money.zero(currency));
    const now = new Date();
    const invoice: Invoice = {
      id: generateId('inv'),
      customerId,
      status: 'open',
      lineItems: [...lineItems],
      currency,
      total,
      periodStart: now,
      periodEnd: now,
      createdAt: now,
    };
    await this.store.save(invoice);
    this.events.emit('invoice.created', { invoice });
    return invoice;
  }

  public async markPaid(invoiceId: string): Promise<Invoice> {
    const invoice = await this.store.findById(invoiceId);
    if (!invoice) throw new NotFoundError('Invoice', invoiceId);
    invoice.status = 'paid';
    invoice.paidAt = new Date();
    await this.store.save(invoice);
    this.events.emit('invoice.paid', { invoice });
    return invoice;
  }

  public async markUncollectible(invoiceId: string): Promise<Invoice> {
    const invoice = await this.store.findById(invoiceId);
    if (!invoice) throw new NotFoundError('Invoice', invoiceId);
    invoice.status = 'uncollectible';
    await this.store.save(invoice);
    return invoice;
  }

  private buildOverageLineItems(plan: Plan, usage: readonly UsageRecord[]): InvoiceLineItem[] {
    if (!plan.overageRatePerUnit || !plan.includedUsage || usage.length === 0) return [];

    const byMeter = new Map<string, number>();
    for (const record of usage) {
      byMeter.set(record.meter, (byMeter.get(record.meter) ?? 0) + record.quantity);
    }

    const lineItems: InvoiceLineItem[] = [];
    for (const [meter, totalQuantity] of byMeter) {
      const included = plan.includedUsage[meter] ?? 0;
      const overageQuantity = Math.max(0, totalQuantity - included);
      const rate = plan.overageRatePerUnit[meter];
      if (overageQuantity > 0 && rate) {
        lineItems.push({
          description: `Overage: ${meter} (${overageQuantity} units above plan allowance)`,
          quantity: overageQuantity,
          unitAmount: rate,
          amount: rate.multiply(overageQuantity),
          metadata: { meter, included, totalQuantity },
        });
      }
    }
    return lineItems;
  }
}
