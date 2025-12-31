/**
 * Upstash Redis Rate Limiting (Edge Runtime Compatible)
 * 
 * This implementation uses @upstash/ratelimit and @upstash/redis
 * which are designed to work in Edge Runtime environments.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Initialize Upstash Redis client (works in Edge Runtime)
let redis: Redis | null = null
let globalLimiter: Ratelimit | null = null
let authLimiter: Ratelimit | null = null

function getRedisClient(): Redis | null {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    // Upstash Redis not configured - rate limiting disabled
    return null
  }

  try {
    redis = new Redis({
      url,
      token,
    })
    return redis
  } catch (error) {
    console.warn('Failed to initialize Upstash Redis:', error)
    return null
  }
}

function getGlobalLimiter(): Ratelimit | null {
  if (globalLimiter) return globalLimiter

  const client = getRedisClient()
  if (!client) return null

  try {
    globalLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 requests per hour
      analytics: true,
    })
    return globalLimiter
  } catch (error) {
    console.warn('Failed to initialize global rate limiter:', error)
    return null
  }
}

function getAuthLimiter(): Ratelimit | null {
  if (authLimiter) return authLimiter

  const client = getRedisClient()
  if (!client) return null

  try {
    authLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
      analytics: true,
    })
    return authLimiter
  } catch (error) {
    console.warn('Failed to initialize auth rate limiter:', error)
    return null
  }
}

/**
 * Apply global rate limiting (all routes)
 */
export async function applyUpstashRateLimit(
  request: { headers: Headers | { get: (key: string) => string | null } }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const limiter = getGlobalLimiter()
  
  if (!limiter) {
    // Upstash not configured - allow request
    return {
      allowed: true,
      remaining: 1000,
      resetTime: Date.now() + 3600000, // 1 hour
    }
  }

  try {
    // Extract IP from headers
    const headers = request.headers
    const getHeader = (key: string) => {
      if ('get' in headers) {
        return headers.get(key)
      }
      return null
    }
    
    const ip = 
      getHeader('cf-connecting-ip') ||
      getHeader('x-forwarded-for')?.split(',')[0] ||
      'unknown'

    const result = await limiter.limit(ip)

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    }
  } catch (error) {
    // Rate limiting failed - allow request (fail open)
    console.warn('Upstash rate limiting error (allowing request):', error)
    return {
      allowed: true,
      remaining: 1000,
      resetTime: Date.now() + 3600000,
    }
  }
}

/**
 * Apply stricter rate limiting for auth endpoints
 */
export async function applyUpstashAuthRateLimit(
  request: { headers: Headers | { get: (key: string) => string | null } },
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const limiter = getAuthLimiter()
  
  if (!limiter) {
    // Upstash not configured - allow request
    return {
      allowed: true,
      remaining: 5,
      resetTime: Date.now() + 900000, // 15 minutes
    }
  }

  try {
    const result = await limiter.limit(`auth:${identifier}`)

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    }
  } catch (error) {
    // Rate limiting failed - allow request (fail open)
    console.warn('Upstash auth rate limiting error (allowing request):', error)
    return {
      allowed: true,
      remaining: 5,
      resetTime: Date.now() + 900000,
    }
  }
}

