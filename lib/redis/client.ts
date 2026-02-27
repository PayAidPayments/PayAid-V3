import Redis from 'ioredis'

let redis: Redis | null = null
let errorLogged = false
let isConnected = false

/** No-op Redis stub for Vercel build / when Redis is not available. Avoids ECONNREFUSED during build. */
function createNoopRedisClient(): Redis {
  const noop = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve('OK'),
    setex: () => Promise.resolve('OK'),
    del: () => Promise.resolve(0),
    keys: () => Promise.resolve([]),
    exists: () => Promise.resolve(0),
    quit: () => Promise.resolve('OK'),
    on: () => noop,
  } as unknown as Redis
  return noop
}

/** True when we should not attempt a real Redis connection (e.g. Vercel build with no Redis). */
function shouldSkipRedis(): boolean {
  const url = (process.env.REDIS_URL || 'redis://localhost:6379').trim()
  const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1')
  if (process.env.VERCEL === '1' && (!url || isLocalhost)) return true
  if (process.env.CI === 'true' && isLocalhost) return true
  if (process.env.NODE_ENV === 'production' && isLocalhost) return true
  return false
}

export function getRedisClient(): Redis {
  if (!redis) {
    if (shouldSkipRedis()) {
      redis = createNoopRedisClient()
      return redis
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 1, // Reduce retries
      retryStrategy(times) {
        // Stop retrying after 3 attempts
        if (times > 3) {
          return null // Stop retrying
        }
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError() {
        return false
      },
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      commandTimeout: 1000,
      enableAutoPipelining: false,
    })

    redis.on('error', (err) => {
      if (!errorLogged) {
        console.warn('⚠️ Redis not available (cache disabled). To enable caching, start Redis:', err.message)
        errorLogged = true
      }
      isConnected = false
    })

    redis.on('connect', () => {
      if (!isConnected) {
        console.log('✅ Redis Client Connected')
        isConnected = true
        errorLogged = false
      }
    })

    redis.on('ready', () => {
      console.log('✅ Redis Client Ready')
      isConnected = true
    })

    redis.on('close', () => {
      isConnected = false
    })
  }

  return redis
}

export async function closeRedisConnection() {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

// Cache helper functions
export class Cache {
  private client: Redis

  constructor() {
    this.client = getRedisClient()
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      // Use promise with timeout to prevent hanging
      const value = await Promise.race([
        this.client.get(key),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 100)), // 100ms timeout
      ])
      return value ? JSON.parse(value) : null
    } catch (error) {
      // Silently fail - Redis is optional
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      // Use promise with timeout to prevent hanging
      await Promise.race([
        ttlSeconds 
          ? this.client.setex(key, ttlSeconds, serialized)
          : this.client.set(key, serialized),
        new Promise<void>((resolve) => setTimeout(() => resolve(), 100)), // 100ms timeout
      ])
    } catch (error) {
      // Silently fail - Redis is optional
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key)
    } catch (error) {
      console.warn('Redis delete error (continuing):', error)
      // Don't throw - caching is optional
    }
  }

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
    } catch (error) {
      console.warn('Redis deletePattern error (continuing):', error)
      // Don't throw - caching is optional
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key)
      return result === 1
    } catch (error) {
      console.warn('Redis exists error (returning false):', error)
      return false
    }
  }
}

export const cache = new Cache()

