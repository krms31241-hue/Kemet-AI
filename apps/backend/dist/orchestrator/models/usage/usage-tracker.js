/**
 * usage-tracker.ts
 *
 * Records per-request token usage and exposes aggregated summaries by
 * session, provider, or model. In-memory and process-local; a durable
 * sink (database, metrics backend) can subscribe to `ModelEventBus`'s
 * `model.usage.recorded` event independently rather than coupling this
 * class to persistence.
 */
import { randomUUID } from "node:crypto";
import { defaultCostEstimator } from "./cost-estimator.js";
const EMPTY_SUMMARY = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
    requestCount: 0,
};
export class UsageTracker {
    records = [];
    costEstimator;
    constructor(costEstimator = defaultCostEstimator) {
        this.costEstimator = costEstimator;
    }
    record(params) {
        const estimatedCost = params.usage.estimatedCost ?? this.costEstimator.estimate(params.providerId, params.model, params.usage);
        const record = {
            id: randomUUID(),
            sessionId: params.sessionId,
            providerId: params.providerId,
            model: params.model,
            promptTokens: params.usage.promptTokens,
            completionTokens: params.usage.completionTokens,
            totalTokens: params.usage.totalTokens,
            estimatedCost,
            timestamp: new Date(),
        };
        this.records.push(record);
        return record;
    }
    query(filter = {}) {
        return this.records.filter((record) => {
            if (filter.sessionId && record.sessionId !== filter.sessionId)
                return false;
            if (filter.providerId && record.providerId !== filter.providerId)
                return false;
            if (filter.model && record.model !== filter.model)
                return false;
            if (filter.since && record.timestamp < filter.since)
                return false;
            return true;
        });
    }
    summarize(filter = {}) {
        const matched = this.query(filter);
        if (matched.length === 0) {
            return EMPTY_SUMMARY;
        }
        return matched.reduce((summary, record) => ({
            promptTokens: summary.promptTokens + record.promptTokens,
            completionTokens: summary.completionTokens + record.completionTokens,
            totalTokens: summary.totalTokens + record.totalTokens,
            estimatedCost: summary.estimatedCost + record.estimatedCost,
            requestCount: summary.requestCount + 1,
        }), { ...EMPTY_SUMMARY });
    }
    clear() {
        this.records.length = 0;
    }
}
export const usageTracker = new UsageTracker();
