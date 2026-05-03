// Check if we're in Edge Runtime (where ioredis doesn't work)
// @ts-ignore - EdgeRuntime is a global in Edge Runtime environments
const isEdgeRuntime = typeof (globalThis as any).EdgeRuntime !== 'undefined' ||
  (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge')

// Only import cache if not in Edge Runtime
let cache: any = null
if (!isEdgeRuntime) {
  try {
    cache = require('../redis/client').cache
  } catch (error) {
    // Redis client not available
    cache = null
  }
}

interface RateLimitOptions {
  windowMs: number // Time window in milliseconds
  max: number // Maximum number of requests
  keyGenerator?: (req: any) => string // Custom key generator
}

export class RateLimiter {
  private windowMs: number
  private max: number
  private keyGenerator: (req: any) => string

  constructor(options: RateLimitOptions) {
    this.windowMs = options.windowMs
    this.max = options.max
    this.keyGenerator = options.keyGenerator || ((req) => {
      // Default: use IP address
      return req.ip || req.headers?.['x-forwarded-for'] || req.headers?.['cf-connecting-ip'] || 'unknown'
    })
  }

  async check(req: any): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    // In Edge Runtime or if Redis is not available, allow all requests
    if (isEdgeRuntime || !cache) {
      return {
        allowed: true,
        remaining: this.max,
        resetTime: Date.now() + this.windowMs,
      }
    }

    try {
      const key = `rate-limit:${this.keyGenerator(req)}`
      const windowKey = `rate-limit-window:${key}`
      
      // Get current count (with error handling)
      let current = 0
      let windowStart = Date.now()
      
      try {
        current = (await cache.get(key)) || 0
        windowStart = (await cache.get(windowKey)) || Date.now()
      } catch (error) {
        // Redis not available - allow request (fail open)
        return {
          allowed: true,
          remaining: this.max,
          resetTime: Date.now() + this.windowMs,
        }
      }
      
      const now = Date.now()
      const windowAge = now - windowStart
      
      // If window expired, reset
      if (windowAge > this.windowMs) {
        try {
          await cache.set(key, 1, Math.ceil(this.windowMs / 1000))
          await cache.set(windowKey, now, Math.ceil(this.windowMs / 1000))
        } catch (error) {
          // Redis error - allow request
        }
        
        return {
          allowed: true,
          remaining: this.max - 1,
          resetTime: now + this.windowMs,
        }
      }
      
      // Check if limit exceeded
      if (current >= this.max) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart + this.windowMs,
        }
      }
      
      // Increment counter
      const newCount = current + 1
      const ttl = Math.ceil((this.windowMs - windowAge) / 1000)
      try {
        await cache.set(key, newCount, ttl)
      } catch (error) {
        // Redis error - allow request anyway
      }
      
      return {
        allowed: true,
        remaining: this.max - newCount,
        resetTime: windowStart + this.windowMs,
      }
    } catch (error) {
      // Any error - fail open (allow request)
      return {
        allowed: true,
        remaining: this.max,
        resetTime: Date.now() + this.windowMs,
      }
    }
  }
}

// Pre-configured rate limiters by tier
export const rateLimiters = {
  free: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
  }),
  starter: new RateLimiter({
    windowMs: 60 * 1000,
    max: 500,
  }),
  professional: new RateLimiter({
    windowMs: 60 * 1000,
    max: 2000,
  }),
  enterprise: new RateLimiter({
    windowMs: 60 * 1000,
    max: 10000,
  }),
}

// Global IP-based rate limiter
export const ipRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  max: 1000,
  keyGenerator: (req) => {
    // Extract IP from headers (Edge Runtime compatible)
    return req.ip || req.headers?.['x-forwarded-for'] || req.headers?.['cf-connecting-ip'] || 'unknown'
  },
})

