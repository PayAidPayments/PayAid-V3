/**
 * Upstash Redis Rate Limiting (Edge Runtime Compatible)
 * 
 * This implementation uses @upstash/ratelimit and @upstash/redis
 * which are designed to work in Edge Runtime environments.
 */

// Lazy import to avoid Edge Runtime issues
let Ratelimit: any = null
let Redis: any = null

async function ensureUpstashImports() {
  if (Ratelimit && Redis) return true
  
  try {
    const ratelimitModule = await import('@upstash/ratelimit')
    const redisModule = await import('@upstash/redis')
    Ratelimit = ratelimitModule.Ratelimit
    Redis = redisModule.Redis
    return true
  } catch (error) {
    // Upstash packages not available or import failed
    return false
  }
}

// Lazy initialization to avoid Edge Runtime issues
let redis: Redis | null = null
let globalLimiter: Ratelimit | null = null
let authLimiter: Ratelimit | null = null
let initAttempted = false

async function getRedisClient(): Promise<any> {
  // Return cached client if available
  if (redis) return redis

  // Check if we've already attempted initialization and failed
  if (initAttempted && !redis) return null

  // Ensure Upstash packages are imported
  const importsOk = await ensureUpstashImports()
  if (!importsOk) {
    initAttempted = true
    return null
  }

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
    return null
  }
}

async function getGlobalLimiter(): Promise<any> {
  if (globalLimiter) return globalLimiter

  const client = await getRedisClient()
  if (!client) return null

  try {
    globalLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(1000, '1 h'), // 1000 requests per hour
      analytics: true,
    })
    return globalLimiter
  } catch (error) {
    return null
  }
}

async function getAuthLimiter(): Promise<any> {
  if (authLimiter) return authLimiter

  const client = await getRedisClient()
  if (!client) return null

  try {
    authLimiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 attempts per 15 minutes
      analytics: true,
    })
    return authLimiter
  } catch (error) {
    return null
  }
}

/**
 * Apply global rate limiting (all routes)
 */
export async function applyUpstashRateLimit(
  request: { headers: { get: (key: string) => string | null } }
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  // Always return allow if anything fails (fail open)
  try {
    const limiter = await getGlobalLimiter()
    
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
    // Any error - allow request (fail open)
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
  // Always return allow if anything fails (fail open)
  try {
    const limiter = await getAuthLimiter()
    
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
    // Any error - allow request (fail open)
    return {
      allowed: true,
      remaining: 5,
      resetTime: Date.now() + 900000,
    }
  }
}

