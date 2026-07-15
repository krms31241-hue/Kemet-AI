/**
 * usage.types.ts
 *
 * Types for tracking token consumption and estimated cost across
 * providers, models, and sessions.
 */

import type { ProviderUsage } from "../providers/provider.types.js";

export interface UsageRecord {
  readonly id: string;
  readonly sessionId: string;
  readonly providerId: string;
  readonly model: string;
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly estimatedCost: number;
  readonly timestamp: Date;
}

export interface UsageSummary {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
  readonly estimatedCost: number;
  readonly requestCount: number;
}

export interface UsageQuery {
  readonly sessionId?: string;
  readonly providerId?: string;
  readonly model?: string;
  readonly since?: Date;
}

/**
 * Pluggable cost calculation strategy so pricing tables can be swapped or
 * updated without touching the tracker itself (open/closed principle).
 */
export interface CostEstimator {
  estimate(providerId: string, model: string, usage: ProviderUsage): number;
}

/** Per-1K-token pricing for a given provider/model pair, in USD. */
export interface UsagePricing {
  readonly promptPricePer1k: number;
  readonly completionPricePer1k: number;
}

