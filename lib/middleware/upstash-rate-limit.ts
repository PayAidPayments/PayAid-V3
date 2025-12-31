/**
 * Upstash Redis Rate Limiting (Edge Runtime Compatible)
 * 
 * This implementation uses @upstash/ratelimit and @upstash/redis
 * which are designed to work in Edge Runtime environments.
 */

import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Lazy initialization to avoid Edge Runtime issues
let redis: Redis | null = null
let globalLimiter: Ratelimit | null = null
let authLimiter: Ratelimit | null = null
let initAttempted = false

function getRedisClient(): Redis | null {
  // Return cached client if available
  if (redis) return redis

  // Check if we've already attempted initialization and failed
  if (initAttempted && !redis) return null

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    initAttempted = true
    return null
  }

  try {
    redis = new Redis({
      url,
      token,
    })
    initAttempted = true
    return redis
  } catch (error) {
    initAttempted = true
    // Don't log in Edge Runtime to avoid errors
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Failed to initialize Upstash Redis:', error)
    }
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
    // Don't log in Edge Runtime to avoid errors
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Failed to initialize global rate limiter:', error)
    }
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
    // Don't log in Edge Runtime to avoid errors
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Failed to initialize auth rate limiter:', error)
    }
    return null
  }
}

/**
 * Apply global rate limiting (all routes)
 */
export async function applyUpstashRateLimit(
  request: { headers: { get: (key: string) => string | null } }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const limiter = getGlobalLimiter()
    
    if (!limiter) {
      // Upstash not configured - allow request
      return {
        allowed: true,
        remaining: 1000,
        resetTime: Date.now() + 3600000, // 1 hour
      }
    }

    // Extract IP from headers
    const ip = 
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'unknown'

    const result = await limiter.limit(ip)

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    }
  } catch (error) {
    // Rate limiting failed - allow request (fail open)
    // Don't log in Edge Runtime to avoid errors
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Upstash rate limiting error (allowing request):', error)
    }
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
  request: { headers: { get: (key: string) => string | null } },
  identifier: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  try {
    const limiter = getAuthLimiter()
    
    if (!limiter) {
      // Upstash not configured - allow request
      return {
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 900000, // 15 minutes
      }
    }

    const result = await limiter.limit(`auth:${identifier}`)

    return {
      allowed: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
    }
  } catch (error) {
    // Rate limiting failed - allow request (fail open)
    // Don't log in Edge Runtime to avoid errors
    if (typeof console !== 'undefined' && console.warn) {
      console.warn('Upstash auth rate limiting error (allowing request):', error)
    }
    return {
      allowed: true,
      remaining: 5,
      resetTime: Date.now() + 900000,
    }
  }
}

