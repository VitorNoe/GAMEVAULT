/**
 * Simple in-memory cache with TTL support.
 * Suitable for development and moderate traffic. For production scale,
 * swap this out with Redis (same interface).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTTL: number; // milliseconds

  constructor(defaultTTLSeconds = 60) {
    this.defaultTTL = defaultTTLSeconds * 1000;

    // Periodically evict expired entries every 30 seconds
    setInterval(() => this.evictExpired(), 30_000).unref();
  }

  /**
   * Get a cached value, or undefined if expired/missing.
   */
  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  /**
   * Store a value with optional TTL override (in seconds).
   */
  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = (ttlSeconds ?? this.defaultTTL / 1000) * 1000;
    this.store.set(key, { data, expiresAt: Date.now() + ttl });
  }

  /**
   * Invalidate a single key.
   */
  del(key: string): void {
    this.store.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix.
   */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

// Singleton – 60-second default TTL for game catalog queries
export const catalogCache = new MemoryCache(60);

export default MemoryCache;
