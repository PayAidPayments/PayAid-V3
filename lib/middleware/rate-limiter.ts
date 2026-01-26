/**
 * Rate Limiting Middleware
 * Zero-cost enhancement for API safety and abuse prevention
 */

import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'

// Initialize Redis client (if available)
let redis: Redis | null = null
try {
  if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL)
  }
} catch (error) {
  console.warn('Redis not available, using in-memory rate limiting')
}

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (request: NextRequest) => string // Custom key generator
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
}

const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
}

/**
 * Rate limiting middleware
 */
export async function rateLimit(
  request: NextRequest,
  config: Partial<RateLimitConfig> = {}
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const finalConfig = { ...defaultConfig, ...config }
  const key = finalConfig.keyGenerator
    ? finalConfig.keyGenerator(request)
    : generateDefaultKey(request)

  const now = Date.now()
  const windowStart = now - (now % finalConfig.windowMs)

  try {
    if (redis) {
      // Use Redis for distributed rate limiting
      const current = await redis.get(`ratelimit:${key}:${windowStart}`)
      const count = current ? parseInt(current, 10) : 0

      if (count >= finalConfig.maxRequests) {
        const resetTime = windowStart + finalConfig.windowMs
        return {
          allowed: false,
          remaining: 0,
          resetTime,
        }
      }

      // Increment counter
      await redis.incr(`ratelimit:${key}:${windowStart}`)
      await redis.expire(`ratelimit:${key}:${windowStart}`, Math.ceil(finalConfig.windowMs / 1000))

      return {
        allowed: true,
        remaining: finalConfig.maxRequests - count - 1,
        resetTime: windowStart + finalConfig.windowMs,
      }
    } else {
      // Use in-memory store
      const storeKey = `${key}:${windowStart}`
      const current = memoryStore.get(storeKey)

      if (current && current.resetTime > now) {
        if (current.count >= finalConfig.maxRequests) {
          return {
            allowed: false,
            remaining: 0,
            resetTime: current.resetTime,
          }
        }
        current.count++
      } else {
        memoryStore.set(storeKey, {
          count: 1,
          resetTime: windowStart + finalConfig.windowMs,
        })
      }

      const entry = memoryStore.get(storeKey)!
      return {
        allowed: true,
        remaining: finalConfig.maxRequests - entry.count,
        resetTime: entry.resetTime,
      }
    }
  } catch (error) {
    // If rate limiting fails, allow the request (fail open)
    console.error('[Rate Limiter] Error:', error)
    return {
      allowed: true,
      remaining: finalConfig.maxRequests,
      resetTime: windowStart + finalConfig.windowMs,
    }
  }
}

/**
 * Generate default rate limit key from request
 */
function generateDefaultKey(request: NextRequest): string {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
  const path = new URL(request.url).pathname
  return `${ip}:${path}`
}

/**
 * Rate limit middleware wrapper for API routes
 */
export function withRateLimit(config?: Partial<RateLimitConfig>) {
  return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
    const limitResult = await rateLimit(request, config)

    if (!limitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil((limitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(config?.maxRequests || defaultConfig.maxRequests),
            'X-RateLimit-Remaining': String(limitResult.remaining),
            'X-RateLimit-Reset': String(limitResult.resetTime),
            'Retry-After': String(Math.ceil((limitResult.resetTime - Date.now()) / 1000)),
          },
        }
      )
    }

    const response = await handler()

    // Add rate limit headers to response
    response.headers.set('X-RateLimit-Limit', String(config?.maxRequests || defaultConfig.maxRequests))
    response.headers.set('X-RateLimit-Remaining', String(limitResult.remaining))
    response.headers.set('X-RateLimit-Reset', String(limitResult.resetTime))

    return response
  }
}
