/**
 * Redis Caching for Performance Optimization
 * Caches forecasts and other expensive computations
 */

import { Redis } from 'ioredis'

const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : null

const CACHE_TTL = {
  FORECAST: 3600, // 1 hour
  WHAT_IF: 1800, // 30 minutes
  MODEL_CONFIG: 86400, // 24 hours
}

export async function getCachedForecast(tenantId: string, key: string): Promise<any | null> {
  if (!redis) return null

  try {
    const cached = await redis.get(`forecast:${tenantId}:${key}`)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export async function setCachedForecast(tenantId: string, key: string, data: any): Promise<void> {
  if (!redis) return

  try {
    await redis.setex(
      `forecast:${tenantId}:${key}`,
      CACHE_TTL.FORECAST,
      JSON.stringify(data)
    )
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export async function getCachedWhatIf(tenantId: string, scenarioHash: string): Promise<any | null> {
  if (!redis) return null

  try {
    const cached = await redis.get(`whatif:${tenantId}:${scenarioHash}`)
    return cached ? JSON.parse(cached) : null
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export async function setCachedWhatIf(tenantId: string, scenarioHash: string, data: any): Promise<void> {
  if (!redis) return

  try {
    await redis.setex(
      `whatif:${tenantId}:${scenarioHash}`,
      CACHE_TTL.WHAT_IF,
      JSON.stringify(data)
    )
  } catch (error) {
    console.error('Cache set error:', error)
  }
}

export async function invalidateCache(tenantId: string, pattern: string): Promise<void> {
  if (!redis) return

  try {
    const keys = await redis.keys(`${pattern}:${tenantId}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.error('Cache invalidation error:', error)
  }
}
