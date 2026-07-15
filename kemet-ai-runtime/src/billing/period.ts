import type { BillingInterval } from './types.js';

export function advancePeriod(from: Date, interval: BillingInterval, count: number): Date {
  const result = new Date(from.getTime());
  switch (interval) {
    case 'day':
      result.setUTCDate(result.getUTCDate() + count);
      return result;
    case 'week':
      result.setUTCDate(result.getUTCDate() + count * 7);
      return result;
    case 'month': {
      const targetMonth = result.getUTCMonth() + count;
      const originalDay = result.getUTCDate();
      result.setUTCDate(1);
      result.setUTCMonth(targetMonth);
      const daysInTargetMonth = new Date(
        Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
      ).getUTCDate();
      result.setUTCDate(Math.min(originalDay, daysInTargetMonth));
      return result;
    }
    case 'year':
      result.setUTCFullYear(result.getUTCFullYear() + count);
      return result;
  }
}
