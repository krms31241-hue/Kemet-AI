/**
 * router.types.ts
 *
 * Types for selecting which registered `Provider` should serve a given
 * chat request.
 */

import type { Provider } from "../providers/provider.js";
import type { ProviderCapability } from "../providers/provider.types.js";

export type RoutingStrategy = "priority" | "round-robin" | "least-usage" | "capability-match";

export interface RouteRequest {
  /** Capabilities the selected provider must support (e.g. `["chat", "streaming"]`). */
  readonly requiredCapabilities?: readonly ProviderCapability[];
  /** Pin routing to a specific provider id, bypassing strategy selection. Still validated against required capabilities. */
  readonly providerId?: string;
  /** Model identifier the caller intends to use, passed through for logging/telemetry only. */
  readonly model?: string;
}

export interface RouteDecision {
  readonly provider: Provider;
  readonly strategy: RoutingStrategy;
  readonly reason: string;
}

export interface RouterProviderMetadata {
  /** Higher priority is preferred first under the `"priority"` strategy. Default 0. */
  readonly priority: number;
  /** Disabled providers are never selected regardless of strategy. Default true. */
  readonly enabled: boolean;
}

/** Injectable usage lookup for the `"least-usage"` strategy, decoupling the router from the usage subsystem. */
export type UsageLookup = (providerId: string) => number;

