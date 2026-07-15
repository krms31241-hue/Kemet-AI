/**
 * model.types.ts
 *
 * Types for the `Model` abstraction: a specific model identifier exposed
 * by a `Provider` (e.g. "gpt-4o-mini" under provider "openai"), distinct
 * from the `Provider` connection itself. A single provider commonly
 * exposes several models with different capabilities/pricing/context
 * windows, which the `Provider` interface alone has no way to represent.
 *
 * Reuses `ProviderCapability` (the same string-union used by `Provider`
 * and `ModelRouter`) rather than inventing a parallel capability
 * vocabulary, so a model's advertised capabilities are always directly
 * comparable against a `RouteRequest.requiredCapabilities` or a
 * provider's own `capabilities` list without translation.
 */

import type { ProviderCapability } from "./providers/provider.types.js";

export interface ModelPricing {
  readonly inputPerMillionTokens?: number;
  readonly outputPerMillionTokens?: number;
  readonly currency?: string;
}

export interface ModelDescriptor {
  /** Model identifier as sent in requests (e.g. "gpt-4o-mini"). */
  readonly id: string;
  /** Must match a `Provider.id` registered in `ProviderRegistry`. */
  readonly providerId: string;
  readonly displayName: string;
  readonly capabilities: readonly ProviderCapability[];
  readonly contextWindowTokens?: number;
  readonly maxOutputTokens?: number;
  readonly pricing?: ModelPricing;
  /**
   * Marks a model as no longer recommended for new usage. Excluded from
   * `ModelRegistry.list()` by default (see `ModelLookup.includeDeprecated`),
   * but still resolvable by exact id via `ModelRegistry.get()` so existing
   * sessions already pinned to a deprecated model keep working.
   */
  readonly deprecated?: boolean;
}

export interface ModelLookup {
  readonly providerId?: string;
  readonly requiredCapabilities?: readonly ProviderCapability[];
  /** When false (the default), deprecated models are excluded from `list()` results. */
  readonly includeDeprecated?: boolean;
}
