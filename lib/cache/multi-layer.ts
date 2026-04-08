// @ts-nocheck
/**
 * Multi-Layer Caching System
 * L1: memory, L2: Redis (singleton), L3: database.
 * Phase 1: L2 uses getRedisSingleton() (Upstash or no-op).
 */

import { getRedisSingleton, type RedisLike } from '@/lib/redis/singleton'

interface CacheEntry<T> {
  value: T
  expiry: number
}

export class MultiLayerCache {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private redis: RedisLike
  private readonly MAX_MEMORY_ENTRIES = 1000
  private readonly MEMORY_TTL_MS = 60000

  constructor() {
    this.redis = getRedisSingleton()
  }

  /**
   * Get value from cache (checks L1, then L2)
   */
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now()

    // Check L1 (memory)
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && now < memoryEntry.expiry) {
      return memoryEntry.value as T
    }

    // Remove expired entry from L1
    if (memoryEntry) {
      this.memoryCache.delete(key)
    }

    // Check L2 (Redis singleton)
    try {
      const redisValue = await this.redis.get(key)
      if (redisValue) {
        const value = JSON.parse(redisValue) as T
        this.setMemoryCache(key, value, this.MEMORY_TTL_MS)
        return value
      }
    } catch (error) {
      console.warn('Redis get error (continuing without cache):', error)
    }
    return null
  }

  /**
   * Set value in cache (populates both L1 and L2)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // Set in L1 (memory)
    this.setMemoryCache(key, value, Math.min(ttlSeconds * 1000, this.MEMORY_TTL_MS))

    try {
      const serialized = JSON.stringify(value)
      await this.redis.setex(key, ttlSeconds, serialized)
    } catch (error) {
      console.warn('Redis set error (continuing without cache):', error)
    }
  }

  /**
   * Delete value from cache (removes from both L1 and L2)
   */
  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key)
    try {
      await this.redis.del(key)
    } catch (error) {
      console.warn('Redis delete error (continuing):', error)
    }
  }

  /**
   * Delete all keys matching a pattern (L2 only - Redis pattern matching)
   */
  async deletePattern(pattern: string): Promise<void> {
    const prefix = pattern.replace('*', '')
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) this.memoryCache.delete(key)
    }
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) await this.redis.del(...keys)
    } catch (error) {
      console.warn('Redis deletePattern error (continuing):', error)
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && Date.now() < memoryEntry.expiry) return true
    try {
      const result = await this.redis.exists(key)
      return result === 1
    } catch {
      return false
    }
  }

  /**
   * Clear all cache (both L1 and L2)
   */
  async clear(): Promise<void> {
    // Clear L1
    this.memoryCache.clear()

    // Clear L2 (if Redis is available)
    // Note: This is expensive, use with caution
    if (this.redis) {
      try {
        await this.redis.flushdb()
      } catch (error) {
        console.warn('Redis flushdb error:', error)
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number
    memoryMaxSize: number
    redisAvailable: boolean
  } {
    return {
      memorySize: this.memoryCache.size,
      memoryMaxSize: this.MAX_MEMORY_ENTRIES,
      redisAvailable: this.redis !== null,
    }
  }

  /**
   * Set value in L1 (memory cache) with size limit
   */
  private setMemoryCache<T>(key: string, value: T, ttlMs: number): void {
    // If cache is full, remove oldest entries (FIFO)
    if (this.memoryCache.size >= this.MAX_MEMORY_ENTRIES) {
      const firstKey = this.memoryCache.keys().next().value
      if (firstKey) {
        this.memoryCache.delete(firstKey)
      }
    }

    const expiry = Date.now() + ttlMs
    this.memoryCache.set(key, { value, expiry })
  }

  /**
   * Clean up expired entries from L1
   */
  cleanupMemoryCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.memoryCache.entries()) {
      if (now >= entry.expiry) {
        this.memoryCache.delete(key)
      }
    }
  }
}

// Singleton instance
let multiLayerCacheInstance: MultiLayerCache | null = null
let cleanupTimer: ReturnType<typeof setInterval> | null = null

export function getMultiLayerCache(): MultiLayerCache {
  if (!multiLayerCacheInstance) {
    multiLayerCacheInstance = new MultiLayerCache()
    
    // Clean up expired entries every 5 minutes
    cleanupTimer = setInterval(() => {
      multiLayerCacheInstance?.cleanupMemoryCache()
    }, 5 * 60 * 1000)
    // Do not keep Node process alive for this maintenance timer.
    if (cleanupTimer && typeof (cleanupTimer as any).unref === 'function') {
      ;(cleanupTimer as any).unref()
    }
  }
  
  return multiLayerCacheInstance
}

// Export singleton instance
export const multiLayerCache = getMultiLayerCache()
