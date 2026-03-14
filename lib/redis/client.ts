import Redis from 'ioredis'
import { getRedisConfig } from '@/lib/config/env'

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
  const config = getRedisConfig()
  const isLocalhost =
    config.url.includes('localhost') || config.url.includes('127.0.0.1')
  if (process.env.VERCEL === '1' && !config.tcpAvailable) return true
  if (process.env.CI === 'true' && isLocalhost) return true
  if (process.env.NODE_ENV === 'production' && !config.tcpAvailable) return true
  return false
}

/**
 * ioredis client for Bull queues and legacy usage (events, monitoring).
 * Cache should use getRedisSingleton() from @/lib/redis/singleton.
 */
export function getRedisClient(): Redis {
  if (!redis) {
    if (shouldSkipRedis()) {
      redis = createNoopRedisClient()
      return redis
    }

    const redisUrl = getRedisConfig().url

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

/** Phase 1: Cache uses singleton (Upstash or no-op). Re-export for backward compatibility. */
export { cache } from './singleton'

