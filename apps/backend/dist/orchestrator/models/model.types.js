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
export {};
