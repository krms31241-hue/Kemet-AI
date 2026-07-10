/**
 * cache.types.ts
 *
 * Types for the model-response cache, which avoids re-issuing identical
 * chat requests to a provider within a configurable TTL window.
 */

export interface CacheEntry<T> {
  readonly key: string;
  readonly value: T;
  readonly createdAt: number;
  readonly expiresAt: number;
  hits: number;
}

export interface CacheOptions {
  /** Time-to-live for entries, in milliseconds. Default 60_000. */
  readonly ttlMs?: number;
  /** Maximum number of entries retained before least-recently-used eviction. Default 500. */
  readonly maxEntries?: number;
}

export interface CacheStats {
  readonly size: number;
  readonly hits: number;
  readonly misses: number;
  readonly evictions: number;
}

