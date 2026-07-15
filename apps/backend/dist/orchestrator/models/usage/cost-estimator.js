/**
 * cost-estimator.ts
 *
 * Default cost estimation strategy driven by a configurable per-1K-token
 * pricing table, keyed by `${providerId}:${model}`. Unknown provider/model
 * pairs estimate to zero cost rather than throwing, so usage tracking
 * never breaks a request path over a missing price entry.
 */
function pricingKey(providerId, model) {
    return `${providerId}:${model}`;
}
export class TablePricingCostEstimator {
    pricing = new Map();
    constructor(initialPricing = {}) {
        for (const [key, value] of Object.entries(initialPricing)) {
            this.pricing.set(key, value);
        }
    }
    setPricing(providerId, model, pricing) {
        this.pricing.set(pricingKey(providerId, model), pricing);
    }
    getPricing(providerId, model) {
        return this.pricing.get(pricingKey(providerId, model));
    }
    estimate(providerId, model, usage) {
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
