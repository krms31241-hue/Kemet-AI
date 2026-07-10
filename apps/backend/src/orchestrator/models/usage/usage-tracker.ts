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

import type { ProviderUsage } from "../providers/provider.types.js";
import type { CostEstimator, UsageQuery, UsageRecord, UsageSummary } from "./usage.types.js";
import { defaultCostEstimator } from "./cost-estimator.js";

const EMPTY_SUMMARY: UsageSummary = {
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  estimatedCost: 0,
  requestCount: 0,
};

export class UsageTracker {
  private readonly records: UsageRecord[] = [];
  private readonly costEstimator: CostEstimator;

  constructor(costEstimator: CostEstimator = defaultCostEstimator) {
    this.costEstimator = costEstimator;
  }

  public record(params: {
    readonly sessionId: string;
    readonly providerId: string;
    readonly model: string;
    readonly usage: ProviderUsage;
  }): UsageRecord {
    const estimatedCost = params.usage.estimatedCost ?? this.costEstimator.estimate(params.providerId, params.model, params.usage);

    const record: UsageRecord = {
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

  public query(filter: UsageQuery = {}): UsageRecord[] {
    return this.records.filter((record) => {
      if (filter.sessionId && record.sessionId !== filter.sessionId) return false;
      if (filter.providerId && record.providerId !== filter.providerId) return false;
      if (filter.model && record.model !== filter.model) return false;
      if (filter.since && record.timestamp < filter.since) return false;
      return true;
    });
  }

  public summarize(filter: UsageQuery = {}): UsageSummary {
    const matched = this.query(filter);
    if (matched.length === 0) {
      return EMPTY_SUMMARY;
    }

    return matched.reduce<UsageSummary>(
      (summary, record) => ({
        promptTokens: summary.promptTokens + record.promptTokens,
        completionTokens: summary.completionTokens + record.completionTokens,
        totalTokens: summary.totalTokens + record.totalTokens,
        estimatedCost: summary.estimatedCost + record.estimatedCost,
        requestCount: summary.requestCount + 1,
      }),
      { ...EMPTY_SUMMARY },
    );
  }

  public clear(): void {
    this.records.length = 0;
  }
}

export const usageTracker = new UsageTracker();

