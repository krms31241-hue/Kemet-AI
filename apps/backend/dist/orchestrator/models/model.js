/**
 * model.ts
 *
 * Thin, immutable wrapper around a `ModelDescriptor`. Kept as a class
 * (rather than exposing the raw descriptor everywhere) so capability
 * lookups and other convenience accessors have one place to live instead
 * of being re-derived by every consumer.
 */
export class Model {
    descriptor;
    constructor(descriptor) {
        this.descriptor = descriptor;
    }
    get id() {
        return this.descriptor.id;
    }
    get providerId() {
        return this.descriptor.providerId;
    }
    get displayName() {
        return this.descriptor.displayName;
    }
    get capabilities() {
        return this.descriptor.capabilities;
    }
    get contextWindowTokens() {
        return this.descriptor.contextWindowTokens;
    }
    get maxOutputTokens() {
        return this.descriptor.maxOutputTokens;
    }
    get pricing() {
        return this.descriptor.pricing;
    }
    get deprecated() {
        return this.descriptor.deprecated ?? false;
    }
    /** Whether this model advertises a single given capability. */
    supports(capability) {
        return this.descriptor.capabilities.includes(capability);
    }
    /**
     * Whether this model advertises every capability in `capabilities`.
     * Mirrors the `every(...)` check `ModelRouter.findCandidates` uses for
     * provider-level capability matching, so model-level and
     * provider-level filtering stay logically consistent if a future
     * router consults both.
     */
    supportsAll(capabilities) {
        return capabilities.every((capability) => this.supports(capability));
    }
    toDescriptor() {
        return this.descriptor;
    }
}
