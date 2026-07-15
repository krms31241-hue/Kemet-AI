/**
 * model-registry.ts
 *
 * Catalog of known `Model`s across all registered providers. Mirrors
 * `ProviderRegistry`'s API shape deliberately (`register`/`unregister`/
 * `get`/`list`) for consistency across the two registries.
 *
 * Optionally validates, at registration time, that a model's
 * `providerId` refers to a provider actually present in a
 * `ProviderRegistry` — this only reads the registry's already-public
 * `get()` method and never modifies `ProviderRegistry` itself. Passing
 * no `ProviderRegistry` (the default) skips validation entirely, so
 * existing callers are unaffected.
 */
import { ProviderError, ProviderErrorCode } from "./providers/base/index.js";
import { Model } from "./model.js";
export class ModelRegistry {
    providerRegistry;
    models = new Map();
    constructor(providerRegistry) {
        this.providerRegistry = providerRegistry;
    }
    /**
     * Registers a model descriptor. If this registry was constructed with a
     * `ProviderRegistry`, throws a `ProviderError` (code `NOT_FOUND`) when
     * `descriptor.providerId` does not match any registered provider,
     * preventing orphaned model entries that could never actually be routed.
     */
    register(descriptor) {
        if (this.providerRegistry &&
            !this.providerRegistry.get(descriptor.providerId)) {
            throw new ProviderError({
                code: ProviderErrorCode.NOT_FOUND,
                message: `Cannot register model "${descriptor.id}": no provider registered with id "${descriptor.providerId}"`,
                retryable: false,
                context: { providerName: descriptor.providerId },
            });
        }
        this.models.set(descriptor.id, new Model(descriptor));
    }
    unregister(id) {
        this.models.delete(id);
    }
    /** Exact-id lookup. Returns deprecated models too — deprecation only affects `list()`. */
    get(id) {
        return this.models.get(id) ?? null;
    }
    list(lookup = {}) {
        const includeDeprecated = lookup.includeDeprecated ?? false;
        return [...this.models.values()].filter((model) => {
            if (!includeDeprecated && model.deprecated)
                return false;
            if (lookup.providerId && model.providerId !== lookup.providerId)
                return false;
            if (lookup.requiredCapabilities &&
                !model.supportsAll(lookup.requiredCapabilities))
                return false;
            return true;
        });
    }
}
