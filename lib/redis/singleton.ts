// @ts-nocheck
/**
 * Phase 1: Single Redis abstraction for cache/invalidation/Bull config.
 * Uses @upstash/redis (REST) when UPSTASH_REDIS_REST_* set; otherwise no-op in dev.
 * Bull queues still use ioredis + REDIS_URL (see lib/redis/client.ts getRedisConfig).
 */

import { Redis } from '@upstash/redis'
import { getRedisConfig } from '@/lib/config/env'

export interface RedisLike {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { ex?: number }): Promise<string | null>
  setex(key: string, ttlSeconds: number, value: string): Promise<string | null>
  del(...keys: string[]): Promise<number>
  keys(pattern: string): Promise<string[]>
  exists(key: string): Promise<number>
}

let instance: RedisLike | null = null

function createUpstashClient(): RedisLike | null {
  const { upstashRestUrl, upstashRestToken } = getRedisConfig()
  if (!upstashRestUrl || !upstashRestToken) return null
  try {
    const client = new Redis({ url: upstashRestUrl, token: upstashRestToken })
    return {
      get: (key: string) => client.get(key).then((v) => (v == null ? null : String(v))),
      set: (key: string, value: string, options?: { ex?: number }) =>
        client.set(key, value, options).then(() => 'OK'),
      setex: (key: string, ttlSeconds: number, value: string) =>
        client.set(key, value, { ex: ttlSeconds }).then(() => 'OK'),
      del: (...keys: string[]) => client.del(...keys).then(() => keys.length),
      keys: async (pattern: string) => {
        const out: string[] = []
        let cursor = 0
        do {
          const [next, keys] = await client.scan(cursor, { match: pattern, count: 100 })
          cursor = typeof next === 'string' ? parseInt(next, 10) : next
          out.push(...(keys as string[]))
        } while (cursor !== 0)
        return out
      },
      exists: (key: string) =>
        client.get(key).then((v) => (v != null ? 1 : 0)),
    }
  } catch (e) {
    console.warn('[redis/singleton] Upstash init failed:', (e as Error).message)
    return null
  }
}

function createNoopClient(): RedisLike {
  return {
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 0,
    keys: async () => [],
    exists: async () => 0,
  }
}

/**
 * Returns the single Redis-like client for cache operations.
 * Upstash REST when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN set;
 * otherwise no-op (dev only – production should set Upstash).
 */
export function getRedisSingleton(): RedisLike {
  if (instance !== null) return instance
  const config = getRedisConfig()
  if (config.upstashRestUrl && config.upstashRestToken) {
    const up = createUpstashClient()
    if (up) instance = up
  }
  if (!instance) {
    instance = createNoopClient()
    if (config.cacheAvailable === false && process.env.NODE_ENV === 'production') {
      console.warn(
        '[redis/singleton] Redis cache not configured (no Upstash). Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.'
      )
    }
  }
  return instance
}

/**
 * Cache helper compatible with existing code (get/set/delete).
 * Prefer getRedisSingleton() for new code.
 */
export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedisSingleton()
    if (!redis) return null
    try {
      const v = await redis.get(key)
      if (v == null) return null
      return JSON.parse(v) as T
    } catch {
      return null
    }
  },
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const redis = getRedisSingleton()
    if (!redis) return
    try {
      const s = JSON.stringify(value)
      if (ttlSeconds != null) await redis.setex(key, ttlSeconds, s)
      else await redis.set(key, s)
    } catch {
      // no-op
    }
  },
  async delete(key: string): Promise<void> {
    const redis = getRedisSingleton()
    if (!redis) return
    try {
      await redis.del(key)
    } catch {
      // no-op
    }
  },
  async deletePattern(pattern: string): Promise<void> {
    const redis = getRedisSingleton()
    if (!redis) return
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) await redis.del(...keys)
    } catch {
      // no-op
    }
  },
  async exists(key: string): Promise<boolean> {
    const redis = getRedisSingleton()
    if (!redis) return false
    try {
      const v = await redis.get(key)
      return v != null
    } catch {
      return false
    }
  },
}

/**
 * Health check: set and get a key. Returns true if Redis is working.
 */
export async function checkRedisHealth(): Promise<boolean> {
  const redis = getRedisSingleton()
  if (!redis) return true
  try {
    await redis.set('health:ping', '1', { ex: 10 })
    const v = await redis.get('health:ping')
    return v === '1'
  } catch {
    return false
  }
}
