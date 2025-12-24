/**
 * Redis Cache Utilities
 * Provides caching layer for frequently accessed data
 */

// Simple in-memory cache for development
// In production, replace with actual Redis client
class SimpleCache {
  private cache: Map<string, { value: any; expiry: number }> = new Map()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const expiry = Date.now() + ttlSeconds * 1000
    this.cache.set(key, { value, expiry })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }
}

const cache = new SimpleCache()

// Production Redis client (uncomment when Redis is configured)
/*
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
})

export async function get<T>(key: string): Promise<T | null> {
  const value = await redis.get(key)
  if (!value) return null
  return JSON.parse(value) as T
}

export async function set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, JSON.stringify(value))
}

export async function del(key: string): Promise<void> {
  await redis.del(key)
}
*/

export { cache }
export default cache

