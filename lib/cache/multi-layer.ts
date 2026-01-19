/**
 * Multi-Layer Caching System
 * 
 * L1: In-memory cache (fastest, per-instance)
 * L2: Redis cache (fast, distributed across instances)
 * L3: Database (slowest, but persistent)
 * 
 * Strategy:
 * - Check L1 first (memory)
 * - If miss, check L2 (Redis)
 * - If miss, fetch from L3 (database) and populate both L1 and L2
 */

import { getRedisClient } from '@/lib/redis/client'
import Redis from 'ioredis'

interface CacheEntry<T> {
  value: T
  expiry: number
}

export class MultiLayerCache {
  // L1: In-memory cache (fastest, smallest)
  private memoryCache = new Map<string, CacheEntry<any>>()
  
  // L2: Redis client (fast, distributed)
  private redis: Redis | null = null
  
  // Memory cache size limit (prevent memory leaks)
  private readonly MAX_MEMORY_ENTRIES = 1000
  private readonly MEMORY_TTL_MS = 60000 // 1 minute default

  constructor() {
    try {
      this.redis = getRedisClient()
    } catch (error) {
      console.warn('Redis not available, using memory cache only')
      this.redis = null
    }
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

    // Check L2 (Redis)
    if (this.redis) {
      try {
        const redisValue = await Promise.race([
          this.redis.get(key),
          new Promise<string | null>((resolve) => 
            setTimeout(() => resolve(null), 100) // 100ms timeout
          ),
        ]) as string | null

        if (redisValue) {
          const value = JSON.parse(redisValue) as T
          
          // Populate L1 with value from L2
          this.setMemoryCache(key, value, this.MEMORY_TTL_MS)
          
          return value
        }
      } catch (error) {
        // Redis error - continue without cache
        console.warn('Redis get error (continuing without cache):', error)
      }
    }

    // Cache miss - return null (caller should fetch from database)
    return null
  }

  /**
   * Set value in cache (populates both L1 and L2)
   */
  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    // Set in L1 (memory)
    this.setMemoryCache(key, value, Math.min(ttlSeconds * 1000, this.MEMORY_TTL_MS))

    // Set in L2 (Redis)
    if (this.redis) {
      try {
        const serialized = JSON.stringify(value)
        await Promise.race([
          this.redis.setex(key, ttlSeconds, serialized),
          new Promise<void>((resolve) => 
            setTimeout(() => resolve(), 100) // 100ms timeout
          ),
        ])
      } catch (error) {
        // Redis error - continue without cache
        console.warn('Redis set error (continuing without cache):', error)
      }
    }
  }

  /**
   * Delete value from cache (removes from both L1 and L2)
   */
  async delete(key: string): Promise<void> {
    // Remove from L1
    this.memoryCache.delete(key)

    // Remove from L2
    if (this.redis) {
      try {
        await Promise.race([
          this.redis.del(key),
          new Promise<void>((resolve) => 
            setTimeout(() => resolve(), 100) // 100ms timeout
          ),
        ])
      } catch (error) {
        console.warn('Redis delete error (continuing):', error)
      }
    }
  }

  /**
   * Delete all keys matching a pattern (L2 only - Redis pattern matching)
   */
  async deletePattern(pattern: string): Promise<void> {
    // Clear matching keys from L1 (simple prefix match)
    const prefix = pattern.replace('*', '')
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key)
      }
    }

    // Delete from L2 using Redis pattern matching
    if (this.redis) {
      try {
        const keys = await Promise.race([
          this.redis.keys(pattern),
          new Promise<string[]>((resolve) => 
            setTimeout(() => resolve([]), 200) // 200ms timeout
          ),
        ]) as string[]

        if (keys.length > 0) {
          await Promise.race([
            this.redis.del(...keys),
            new Promise<void>((resolve) => 
              setTimeout(() => resolve(), 200) // 200ms timeout
            ),
          ])
        }
      } catch (error) {
        console.warn('Redis deletePattern error (continuing):', error)
      }
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    // Check L1
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && Date.now() < memoryEntry.expiry) {
      return true
    }

    // Check L2
    if (this.redis) {
      try {
        const result = await Promise.race([
          this.redis.exists(key),
          new Promise<number>((resolve) => 
            setTimeout(() => resolve(0), 100) // 100ms timeout
          ),
        ]) as number

        return result === 1
      } catch (error) {
        return false
      }
    }

    return false
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

export function getMultiLayerCache(): MultiLayerCache {
  if (!multiLayerCacheInstance) {
    multiLayerCacheInstance = new MultiLayerCache()
    
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      multiLayerCacheInstance?.cleanupMemoryCache()
    }, 5 * 60 * 1000)
  }
  
  return multiLayerCacheInstance
}

// Export singleton instance
export const multiLayerCache = getMultiLayerCache()
