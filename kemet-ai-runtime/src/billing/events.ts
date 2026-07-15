import type { Invoice, Subscription } from './types.js';

export interface BillingEventMap {
  'subscription.created': { subscription: Subscription };
  'subscription.renewed': { subscription: Subscription; invoice: Invoice };
  'subscription.canceled': { subscription: Subscription };
  'subscription.past_due': { subscription: Subscription };
  'invoice.created': { invoice: Invoice };
  'invoice.paid': { invoice: Invoice };
  [key: string]: unknown;
}
