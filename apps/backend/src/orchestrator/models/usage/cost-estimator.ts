/**
 * cost-estimator.ts
 *
 * Default cost estimation strategy driven by a configurable per-1K-token
 * pricing table, keyed by `${providerId}:${model}`. Unknown provider/model
 * pairs estimate to zero cost rather than throwing, so usage tracking
 * never breaks a request path over a missing price entry.
 */

import type { ProviderUsage } from "../providers/provider.types.js";
import type { CostEstimator, UsagePricing } from "./usage.types.js";

function pricingKey(providerId: string, model: string): string {
  return `${providerId}:${model}`;
}

export class TablePricingCostEstimator implements CostEstimator {
  private readonly pricing = new Map<string, UsagePricing>();

  constructor(initialPricing: Readonly<Record<string, UsagePricing>> = {}) {
    for (const [key, value] of Object.entries(initialPricing)) {
      this.pricing.set(key, value);
    }
  }

  public setPricing(providerId: string, model: string, pricing: UsagePricing): void {
    this.pricing.set(pricingKey(providerId, model), pricing);
  }

  public getPricing(providerId: string, model: string): UsagePricing | undefined {
    return this.pricing.get(pricingKey(providerId, model));
  }

  public estimate(providerId: string, model: string, usage: ProviderUsage): number {
    const pricing = this.pricing.get(pricingKey(providerId, model));
    if (!pricing) {
      return 0;
    }

    const promptCost = (usage.promptTokens / 1000) * pricing.promptPricePer1k;
    const completionCost = (usage.completionTokens / 1000) * pricing.completionPricePer1k;

    return Math.round((promptCost + completionCost) * 1_000_000) / 1_000_000;
  }
}

export const defaultCostEstimator = new TablePricingCostEstimator();

