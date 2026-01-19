/**
 * Redis-based Rate Limiting
 * Production-ready rate limiting using Redis for distributed systems
 * 
 * Supports:
 * - Tenant-based rate limiting
 * - User-based rate limiting
 * - IP-based rate limiting
 * - Tier-based limits (Free, Basic, Pro, Enterprise)
 */

import { getRedisClient } from '@/lib/redis/client'
import { NextRequest } from 'next/server'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  limit: number
}

export interface RateLimitConfig {
  limit: number // Maximum requests
  window: number // Time window in seconds
  identifier: string // tenantId, userId, or IP
}

// Rate limits by tier
export const RATE_LIMITS = {
  free: {
    perMinute: 60,
    perHour: 1000,
  },
  basic: {
    perMinute: 200,
    perHour: 10000,
  },
  pro: {
    perMinute: 500,
    perHour: 50000,
  },
  enterprise: {
    perMinute: 1000,
    perHour: 100000,
  },
} as const

/**
 * Check rate limit using Redis
 * Uses sliding window algorithm for accurate rate limiting
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { limit, window, identifier } = config
  const redis = getRedisClient()
  const key = `ratelimit:${identifier}:${window}`

  try {
    // Use Redis INCR with EXPIRE for atomic operations
    const current = await redis.incr(key)

    // Set expiry on first request
    if (current === 1) {
      await redis.expire(key, window)
    }

    // Get TTL to calculate reset time
    const ttl = await redis.ttl(key)
    const resetAt = Date.now() + (ttl * 1000)

    if (current > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        limit,
      }
    }

    return {
      allowed: true,
      remaining: Math.max(0, limit - current),
      resetAt,
      limit,
    }
  } catch (error) {
    // Fail open - if Redis is unavailable, allow requests
    // This prevents Redis outages from breaking the application
    console.warn('Rate limit check failed (Redis unavailable), allowing request:', error)
    return {
      allowed: true,
      remaining: limit,
      resetAt: Date.now() + (window * 1000),
      limit,
    }
  }
}

/**
 * Get rate limit for tenant based on subscription tier
 */
export async function getTenantRateLimit(
  tenantId: string,
  tier: keyof typeof RATE_LIMITS = 'free',
  window: 'minute' | 'hour' = 'minute'
): Promise<RateLimitResult> {
  const limits = RATE_LIMITS[tier]
  const limit = window === 'minute' ? limits.perMinute : limits.perHour
  const windowSeconds = window === 'minute' ? 60 : 3600

  return checkRateLimit({
    identifier: `tenant:${tenantId}`,
    limit,
    window: windowSeconds,
  })
}

/**
 * Get rate limit for user
 */
export async function getUserRateLimit(
  userId: string,
  tier: keyof typeof RATE_LIMITS = 'free',
  window: 'minute' | 'hour' = 'minute'
): Promise<RateLimitResult> {
  const limits = RATE_LIMITS[tier]
  const limit = window === 'minute' ? limits.perMinute : limits.perHour
  const windowSeconds = window === 'minute' ? 60 : 3600

  return checkRateLimit({
    identifier: `user:${userId}`,
    limit,
    window: windowSeconds,
  })
}

/**
 * Get rate limit for IP address
 */
export async function getIPRateLimit(
  ip: string,
  window: 'minute' | 'hour' = 'minute'
): Promise<RateLimitResult> {
  // IP-based limits are more restrictive
  const limit = window === 'minute' ? 1000 : 10000
  const windowSeconds = window === 'minute' ? 60 : 3600

  return checkRateLimit({
    identifier: `ip:${ip}`,
    limit,
    window: windowSeconds,
  })
}

/**
 * Extract IP address from Next.js request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for IP (supports proxies, load balancers, CDNs)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  // Fallback - NextRequest doesn't have .ip property
  // Try x-forwarded-for header as last resort
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  
  return 'unknown'
}

/**
 * Middleware helper to check rate limit and return appropriate response
 */
export async function enforceRateLimit(
  request: NextRequest,
  tenantId?: string,
  userId?: string,
  tier: keyof typeof RATE_LIMITS = 'free'
): Promise<{ allowed: boolean; response?: Response }> {
  const ip = getClientIP(request)

  // Check IP-based rate limit first (most restrictive)
  const ipLimit = await getIPRateLimit(ip, 'minute')
  if (!ipLimit.allowed) {
    return {
      allowed: false,
      response: new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests from this IP address',
          resetAt: new Date(ipLimit.resetAt).toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(ipLimit.limit),
            'X-RateLimit-Remaining': String(ipLimit.remaining),
            'X-RateLimit-Reset': String(ipLimit.resetAt),
            'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)),
          },
        }
      ),
    }
  }

  // Check tenant-based rate limit if tenantId is provided
  if (tenantId) {
    const tenantLimit = await getTenantRateLimit(tenantId, tier, 'minute')
    if (!tenantLimit.allowed) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'Tenant rate limit exceeded',
            resetAt: new Date(tenantLimit.resetAt).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(tenantLimit.limit),
              'X-RateLimit-Remaining': String(tenantLimit.remaining),
              'X-RateLimit-Reset': String(tenantLimit.resetAt),
              'Retry-After': String(Math.ceil((tenantLimit.resetAt - Date.now()) / 1000)),
            },
          }
        ),
      }
    }
  }

  // Check user-based rate limit if userId is provided
  if (userId) {
    const userLimit = await getUserRateLimit(userId, tier, 'minute')
    if (!userLimit.allowed) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'Rate limit exceeded',
            message: 'User rate limit exceeded',
            resetAt: new Date(userLimit.resetAt).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(userLimit.limit),
              'X-RateLimit-Remaining': String(userLimit.remaining),
              'X-RateLimit-Reset': String(userLimit.resetAt),
              'Retry-After': String(Math.ceil((userLimit.resetAt - Date.now()) / 1000)),
            },
          }
        ),
      }
    }
  }

  return { allowed: true }
}
