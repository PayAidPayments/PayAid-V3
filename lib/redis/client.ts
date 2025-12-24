import Redis from 'ioredis'

let redis: Redis | null = null
let errorLogged = false
let isConnected = false

export function getRedisClient(): Redis {
  if (!redis) {
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
      reconnectOnError(err) {
        // Don't reconnect on errors - Redis is optional
        return false
      },
      // Enable lazy connect - don't connect immediately
      lazyConnect: true,
      // Don't throw on connection errors
      enableOfflineQueue: false,
      // Connection timeout
      connectTimeout: 2000,
      // Command timeout
      commandTimeout: 1000,
      // Don't auto-reconnect
      enableAutoPipelining: false,
    })

    redis.on('error', (err) => {
      // Only log once to prevent spam
      if (!errorLogged) {
        console.warn('⚠️ Redis not available (cache disabled). To enable caching, start Redis:', err.message)
        errorLogged = true
      }
      isConnected = false
      // Don't throw - Redis is optional for caching
    })

    redis.on('connect', () => {
      if (!isConnected) {
        console.log('✅ Redis Client Connected')
        isConnected = true
        errorLogged = false // Reset error flag on successful connection
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

