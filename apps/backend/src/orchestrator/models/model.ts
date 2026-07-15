/**
 * model.ts
 *
 * Thin, immutable wrapper around a `ModelDescriptor`. Kept as a class
 * (rather than exposing the raw descriptor everywhere) so capability
 * lookups and other convenience accessors have one place to live instead
 * of being re-derived by every consumer.
 */

import type { ModelDescriptor, ModelPricing } from "./model.types.js";
import type { ProviderCapability } from "./providers/provider.types.js";

export class Model {
  public constructor(private readonly descriptor: ModelDescriptor) {}

  public get id(): string {
    return this.descriptor.id;
  }

  public get providerId(): string {
    return this.descriptor.providerId;
  }

  public get displayName(): string {
    return this.descriptor.displayName;
  }

  public get capabilities(): readonly ProviderCapability[] {
    return this.descriptor.capabilities;
  }

  public get contextWindowTokens(): number | undefined {
    return this.descriptor.contextWindowTokens;
  }

  public get maxOutputTokens(): number | undefined {
    return this.descriptor.maxOutputTokens;
  }

  public get pricing(): ModelPricing | undefined {
    return this.descriptor.pricing;
  }

  public get deprecated(): boolean {
    return this.descriptor.deprecated ?? false;
  }

  /** Whether this model advertises a single given capability. */
  public supports(capability: ProviderCapability): boolean {
    return this.descriptor.capabilities.includes(capability);
  }

  /**
   * Whether this model advertises every capability in `capabilities`.
   * Mirrors the `every(...)` check `ModelRouter.findCandidates` uses for
   * provider-level capability matching, so model-level and
   * provider-level filtering stay logically consistent if a future
   * router consults both.
   */
  public supportsAll(capabilities: readonly ProviderCapability[]): boolean {
    return capabilities.every((capability) => this.supports(capability));
  }

  public toDescriptor(): ModelDescriptor {
    return this.descriptor;
  }
}
