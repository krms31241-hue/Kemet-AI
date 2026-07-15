/**
 * model-router.ts
 *
 * Selects which registered `Provider` should handle a given request,
 * according to a pluggable `RoutingStrategy`. Reuses `ProviderRegistry`
 * (providers subsystem) for discovery and `ProviderError` (base provider
 * foundation) for a consistently-shaped "no suitable provider" failure,
 * rather than inventing a parallel error type.
 */
import { providerRegistry } from "../providers/provider-registry.js";
import { ProviderError, ProviderErrorCode } from "../providers/base/index.js";
const DEFAULT_METADATA = { priority: 0, enabled: true };
function capabilityKey(capabilities) {
    return [...(capabilities ?? [])].sort().join(",");
}
export class ModelRouter {
    registry;
    metadata = new Map();
    roundRobinCursors = new Map();
    usageLookup;
    constructor(registry = providerRegistry, usageLookup = () => 0) {
        this.registry = registry;
        this.usageLookup = usageLookup;
    }
    /** Sets routing metadata (priority / enabled) for a provider id. Unset providers default to priority 0, enabled. */
    configureProvider(providerId, metadata) {
        const current = this.metadata.get(providerId) ?? DEFAULT_METADATA;
        this.metadata.set(providerId, { ...current, ...metadata });
    }
    getProviderMetadata(providerId) {
        return this.metadata.get(providerId) ?? DEFAULT_METADATA;
    }
    select(request, strategy = "priority") {
        const candidates = this.findCandidates(request);
        if (candidates.length === 0) {
            throw new ProviderError({
                code: ProviderErrorCode.NOT_FOUND,
                message: request.providerId
                    ? `Provider "${request.providerId}" is not registered, disabled, or missing required capabilities`
                    : `No enabled provider satisfies required capabilities: [${(request.requiredCapabilities ?? []).join(", ")}]`,
                retryable: false,
                context: { model: request.model, requiredCapabilities: request.requiredCapabilities },
            });
        }
        if (request.providerId) {
            return {
                provider: candidates[0],
                strategy,
                reason: `Pinned explicitly to provider "${request.providerId}"`,
            };
        }
        switch (strategy) {
            case "priority":
                return this.selectByPriority(candidates, strategy);
            case "round-robin":
                return this.selectByRoundRobin(candidates, request, strategy);
            case "least-usage":
                return this.selectByLeastUsage(candidates, strategy);
            case "capability-match":
                return { provider: candidates[0], strategy, reason: "First provider matching required capabilities" };
            default: {
                const exhaustiveCheck = strategy;
                throw new ProviderError({
                    code: ProviderErrorCode.VALIDATION,
                    message: `Unknown routing strategy: ${String(exhaustiveCheck)}`,
                    retryable: false,
                });
            }
        }
    }
    findCandidates(request) {
        const required = request.requiredCapabilities ?? [];
        const matches = (provider) => {
            const meta = this.getProviderMetadata(provider.id);
            if (!meta.enabled)
                return false;
            return required.every((capability) => provider.capabilities.includes(capability));
        };
        if (request.providerId) {
            const provider = this.registry.get(request.providerId);
            return provider && matches(provider) ? [provider] : [];
        }
        return this.registry.list().filter(matches);
    }
    selectByPriority(candidates, strategy) {
        const sorted = [...candidates].sort((a, b) => {
            const priorityDiff = this.getProviderMetadata(b.id).priority - this.getProviderMetadata(a.id).priority;
            return priorityDiff !== 0 ? priorityDiff : a.id.localeCompare(b.id);
        });
        const provider = sorted[0];
        return {
            provider,
            strategy,
            reason: `Highest configured priority (${this.getProviderMetadata(provider.id).priority}) among ${candidates.length} candidate(s)`,
        };
    }
    selectByRoundRobin(candidates, request, strategy) {
        const key = capabilityKey(request.requiredCapabilities);
        const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
        const cursor = this.roundRobinCursors.get(key) ?? 0;
        const index = cursor % sorted.length;
        this.roundRobinCursors.set(key, cursor + 1);
        return {
            provider: sorted[index],
            strategy,
            reason: `Round-robin position ${index} of ${sorted.length} for capability set [${key || "none"}]`,
        };
    }
    selectByLeastUsage(candidates, strategy) {
        const sorted = [...candidates].sort((a, b) => {
            const usageDiff = this.usageLookup(a.id) - this.usageLookup(b.id);
            return usageDiff !== 0 ? usageDiff : a.id.localeCompare(b.id);
        });
        const provider = sorted[0];
        return {
            provider,
            strategy,
            reason: `Lowest recorded usage (${this.usageLookup(provider.id)}) among ${candidates.length} candidate(s)`,
        };
    }
}
export const modelRouter = new ModelRouter();
