/**
 * model-router.ts
 *
 * Selects which registered `Provider` should handle a given request,
 * according to a pluggable `RoutingStrategy`. Reuses `ProviderRegistry`
 * (providers subsystem) for discovery and `ProviderError` (base provider
 * foundation) for a consistently-shaped "no suitable provider" failure,
 * rather than inventing a parallel error type.
 */

import { providerRegistry, type ProviderRegistry } from "../providers/provider-registry.js";
import type { Provider } from "../providers/provider.js";
import { ProviderError, ProviderErrorCode } from "../providers/base/index.js";
import type {
  RouteDecision,
  RouteRequest,
  RouterProviderMetadata,
  RoutingStrategy,
  UsageLookup,
} from "./router.types.js";

const DEFAULT_METADATA: RouterProviderMetadata = { priority: 0, enabled: true };

function capabilityKey(capabilities: readonly string[] | undefined): string {
  return [...(capabilities ?? [])].sort().join(",");
}

export class ModelRouter {
  private readonly registry: ProviderRegistry;
  private readonly metadata = new Map<string, RouterProviderMetadata>();
  private readonly roundRobinCursors = new Map<string, number>();
  private readonly usageLookup: UsageLookup;

  constructor(registry: ProviderRegistry = providerRegistry, usageLookup: UsageLookup = () => 0) {
    this.registry = registry;
    this.usageLookup = usageLookup;
  }

  /** Sets routing metadata (priority / enabled) for a provider id. Unset providers default to priority 0, enabled. */
  public configureProvider(providerId: string, metadata: Partial<RouterProviderMetadata>): void {
    const current = this.metadata.get(providerId) ?? DEFAULT_METADATA;
    this.metadata.set(providerId, { ...current, ...metadata });
  }

  public getProviderMetadata(providerId: string): RouterProviderMetadata {
    return this.metadata.get(providerId) ?? DEFAULT_METADATA;
  }

  public select(request: RouteRequest, strategy: RoutingStrategy = "priority"): RouteDecision {
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
        provider: candidates[0]!,
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
        return { provider: candidates[0]!, strategy, reason: "First provider matching required capabilities" };
      default: {
        const exhaustiveCheck: never = strategy;
        throw new ProviderError({
          code: ProviderErrorCode.VALIDATION,
          message: `Unknown routing strategy: ${String(exhaustiveCheck)}`,
          retryable: false,
        });
      }
    }
  }

  private findCandidates(request: RouteRequest): Provider[] {
    const required = request.requiredCapabilities ?? [];

    const matches = (provider: Provider): boolean => {
      const meta = this.getProviderMetadata(provider.id);
      if (!meta.enabled) return false;
      return required.every((capability) => provider.capabilities.includes(capability));
    };

    if (request.providerId) {
      const provider = this.registry.get(request.providerId);
      return provider && matches(provider) ? [provider] : [];
    }

    return this.registry.list().filter(matches);
  }

  private selectByPriority(candidates: Provider[], strategy: RoutingStrategy): RouteDecision {
    const sorted = [...candidates].sort((a, b) => {
      const priorityDiff = this.getProviderMetadata(b.id).priority - this.getProviderMetadata(a.id).priority;
      return priorityDiff !== 0 ? priorityDiff : a.id.localeCompare(b.id);
    });

    const provider = sorted[0]!;
    return {
      provider,
      strategy,
      reason: `Highest configured priority (${this.getProviderMetadata(provider.id).priority}) among ${candidates.length} candidate(s)`,
    };
  }

  private selectByRoundRobin(candidates: Provider[], request: RouteRequest, strategy: RoutingStrategy): RouteDecision {
    const key = capabilityKey(request.requiredCapabilities);
    const sorted = [...candidates].sort((a, b) => a.id.localeCompare(b.id));
    const cursor = this.roundRobinCursors.get(key) ?? 0;
    const index = cursor % sorted.length;
    this.roundRobinCursors.set(key, cursor + 1);

    return {
      provider: sorted[index]!,
      strategy,
      reason: `Round-robin position ${index} of ${sorted.length} for capability set [${key || "none"}]`,
    };
  }

  private selectByLeastUsage(candidates: Provider[], strategy: RoutingStrategy): RouteDecision {
    const sorted = [...candidates].sort((a, b) => {
      const usageDiff = this.usageLookup(a.id) - this.usageLookup(b.id);
      return usageDiff !== 0 ? usageDiff : a.id.localeCompare(b.id);
    });

    const provider = sorted[0]!;
    return {
      provider,
      strategy,
      reason: `Lowest recorded usage (${this.usageLookup(provider.id)}) among ${candidates.length} candidate(s)`,
    };
  }
}

export const modelRouter = new ModelRouter();

