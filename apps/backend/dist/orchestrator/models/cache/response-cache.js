/**
 * response-cache.ts
 *
 * In-memory, TTL-bounded, size-bounded (LRU eviction) cache for provider
 * chat responses. Generic over the cached value type so it can be reused
 * for non-chat payloads (e.g. embeddings) in the future without change.
 */
import { createHash } from "node:crypto";
const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 500;
/**
 * Builds a stable cache key from a provider id and chat request. Object
 * key order is normalized (via sorted-key JSON serialization) so
 * semantically identical requests always hash to the same key regardless
 * of property insertion order.
 */
export function buildCacheKey(providerId, model, request) {
    const normalized = {
        providerId,
        model,
        messages: request.messages.map((message) => ({
            role: message.role,
            content: message.content,
            name: message.name ?? null,
        })),
        temperature: request.temperature ?? null,
        maxTokens: request.maxTokens ?? null,
    };
    const serialized = JSON.stringify(normalized);
    return createHash("sha256").update(serialized).digest("hex");
}
/**
 * Generic in-memory cache with TTL expiry and LRU eviction once
 * `maxEntries` is exceeded. Not distributed / not persisted — intended as
 * a single-process optimization layer in front of provider calls.
 */
export class ResponseCache {
    entries = new Map();
    ttlMs;
    maxEntries;
    hits = 0;
    misses = 0;
    evictions = 0;
    constructor(options = {}) {
        this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
        this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
        if (this.ttlMs <= 0) {
            throw new RangeError("CacheOptions.ttlMs must be > 0");
        }
        if (this.maxEntries <= 0) {
            throw new RangeError("CacheOptions.maxEntries must be > 0");
        }
    }
    get(key) {
        const entry = this.entries.get(key);
        if (!entry) {
            this.misses += 1;
            return undefined;
        }
        if (Date.now() >= entry.expiresAt) {
            this.entries.delete(key);
            this.misses += 1;
            return undefined;
        }
        // Refresh recency for LRU by re-inserting at the end of iteration order.
        this.entries.delete(key);
        entry.hits += 1;
        this.entries.set(key, entry);
        this.hits += 1;
        return entry.value;
    }
    set(key, value, ttlMsOverride) {
        const now = Date.now();
        const entry = {
            key,
            value,
            createdAt: now,
            expiresAt: now + (ttlMsOverride ?? this.ttlMs),
            hits: 0,
        };
        this.entries.delete(key);
        this.entries.set(key, entry);
        this.enforceCapacity();
    }
    has(key) {
        const entry = this.entries.get(key);
        if (!entry) {
            return false;
        }
        if (Date.now() >= entry.expiresAt) {
            this.entries.delete(key);
            return false;
        }
        return true;
    }
    delete(key) {
        return this.entries.delete(key);
    }
    clear() {
        this.entries.clear();
        this.hits = 0;
        this.misses = 0;
        this.evictions = 0;
    }
    stats() {
        return {
            size: this.entries.size,
            hits: this.hits,
            misses: this.misses,
            evictions: this.evictions,
        };
    }
    /** Removes all expired entries eagerly. Intended to be called on a timer if desired. */
    sweep() {
        const now = Date.now();
        let removed = 0;
        for (const [key, entry] of this.entries) {
            if (now >= entry.expiresAt) {
                this.entries.delete(key);
                removed += 1;
            }
        }
        return removed;
    }
    enforceCapacity() {
        while (this.entries.size > this.maxEntries) {
            const oldestKey = this.entries.keys().next().value;
            if (oldestKey === undefined) {
                break;
            }
            this.entries.delete(oldestKey);
            this.evictions += 1;
        }
    }
}
