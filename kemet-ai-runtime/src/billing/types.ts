import type { Money } from '../core/money.js';

export type BillingInterval = 'day' | 'week' | 'month' | 'year';

export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly price: Money;
  readonly interval: BillingInterval;
  readonly intervalCount: number;
  readonly includedUsage?: Readonly<Record<string, number>>;
  readonly overageRatePerUnit?: Readonly<Record<string, Money>>;
  readonly trialDays?: number;
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

export interface Subscription {
  readonly id: string;
  readonly customerId: string;
  readonly planId: string;
  status: SubscriptionStatus;
  readonly currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  readonly createdAt: Date;
  canceledAt?: Date;
}

export interface InvoiceLineItem {
  readonly description: string;
  readonly quantity: number;
  readonly unitAmount: Money;
  readonly amount: Money;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

export type InvoiceStatus = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';

export interface Invoice {
  readonly id: string;
  readonly customerId: string;
  readonly subscriptionId?: string;
  status: InvoiceStatus;
  readonly lineItems: InvoiceLineItem[];
  readonly currency: string;
  readonly total: Money;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly createdAt: Date;
  paidAt?: Date;
}

export interface UsageRecord {
  readonly customerId: string;
  readonly subscriptionId: string;
  readonly meter: string;
  readonly quantity: number;
  readonly timestamp: Date;
}
