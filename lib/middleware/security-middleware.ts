/**
 * Security Middleware (Layer 4)
 * Rate limiting, API key validation, and security checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { applyUpstashRateLimit, applyUpstashAuthRateLimit } from '../middleware/upstash-rate-limit'

// Lazy import for Node.js-only modules (not used in Edge Runtime middleware)
let ipRateLimiter: any = null
let validateAPIKey: any = null

async function getNodeModules() {
  if (ipRateLimiter && validateAPIKey) return { ipRateLimiter, validateAPIKey }
  
  // Only import in Node.js runtime, not Edge Runtime
  if (typeof EdgeRuntime !== 'undefined' || 
      (typeof process !== 'undefined' && process.env.NEXT_RUNTIME === 'edge')) {
    return { ipRateLimiter: null, validateAPIKey: null }
  }
  
  try {
    const rateLimitModule = await import('../middleware/rate-limit')
    const apiKeysModule = await import('../security/api-keys')
    ipRateLimiter = rateLimitModule.ipRateLimiter
    validateAPIKey = apiKeysModule.validateAPIKey
    return { ipRateLimiter, validateAPIKey }
  } catch (error) {
    return { ipRateLimiter: null, validateAPIKey: null }
  }
}

/**
 * Apply rate limiting to requests
 */
export async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  try {
    // Try Upstash Redis first (works in Edge Runtime)
    let upstashResult
    try {
      upstashResult = await applyUpstashRateLimit({
        headers: request.headers,
      })
    } catch (error) {
      // Upstash rate limiting failed - skip it and continue
      upstashResult = { allowed: true, remaining: 1000, resetTime: Date.now() + 3600000 }
    }
    
    if (upstashResult && !upstashResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests',
          retryAfter: Math.ceil((upstashResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((upstashResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '1000',
            'X-RateLimit-Remaining': upstashResult.remaining.toString(),
            'X-RateLimit-Reset': upstashResult.resetTime.toString(),
          }
        }
      )
    }

    // If Upstash is not configured, try fallback to ioredis (Node.js only)
    const nodeModules = await getNodeModules()
    if (nodeModules.ipRateLimiter) {
      const clientIP = 
        request.headers.get('cf-connecting-ip') || 
        request.headers.get('x-forwarded-for')?.split(',')[0] || 
        'unknown'
      
      try {
        const result = await nodeModules.ipRateLimiter.check({
          ip: clientIP,
          headers: Object.fromEntries(request.headers.entries()),
        })
        
        if (!result.allowed) {
          return NextResponse.json(
            { 
              error: 'Too many requests',
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
                'X-RateLimit-Limit': '1000',
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': result.resetTime.toString(),
              }
            }
          )
        }
      } catch (error) {
        // Fallback rate limiting failed - allow request
      }
    }
    
    return null
  } catch (error) {
    // Rate limiting failed - allow request (fail open)
    return null
  }
}

/**
 * Validate API key for API routes
 */
export async function validateAPIKeyMiddleware(
  request: NextRequest
): Promise<{ valid: true; orgId: string; scopes: string[] } | { valid: false; response: NextResponse }> {
  // API key validation uses Node.js modules - skip in Edge Runtime
  const nodeModules = await getNodeModules()
  if (!nodeModules.validateAPIKey) {
    // In Edge Runtime, return invalid (API key validation not available)
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'API key validation not available in Edge Runtime' },
        { status: 401 }
      )
    }
  }
  
  const authHeader = request.headers.get('authorization')
  const clientIP = 
    request.headers.get('cf-connecting-ip') || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    'unknown'
  
  try {
    const result = await nodeModules.validateAPIKey(authHeader, clientIP)
    
    if (!result.valid) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: 'Invalid or missing API key' },
          { status: 401 }
        )
      }
    }
    
    return result
  } catch (error) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: 'API key validation failed' },
        { status: 401 }
      )
    }
  }
}

/**
 * Enhanced auth rate limiter (stricter for login endpoints)
 */
export async function applyAuthRateLimit(
  request: NextRequest,
  identifier: string
): Promise<NextResponse | null> {
  try {
    // Try Upstash Redis first (works in Edge Runtime)
    let upstashResult
    try {
      upstashResult = await applyUpstashAuthRateLimit({
        headers: request.headers,
      }, identifier)
    } catch (error) {
      // Upstash auth rate limiting failed - skip it and continue
      upstashResult = { allowed: true, remaining: 5, resetTime: Date.now() + 900000 }
    }
    
    if (upstashResult && !upstashResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many login attempts. Please try again in 15 minutes.',
          retryAfter: Math.ceil((upstashResult.resetTime - Date.now()) / 1000)
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil((upstashResult.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Remaining': upstashResult.remaining.toString(),
          }
        }
      )
    }

    // If Upstash is not configured, try fallback to ioredis (Node.js only)
    const nodeModules = await getNodeModules()
    if (nodeModules.ipRateLimiter) {
      try {
        const RateLimiter = (await import('../middleware/rate-limit')).RateLimiter
        const authLimiter = new RateLimiter({
          windowMs: 15 * 60 * 1000, // 15 minutes
          max: 5, // 5 attempts per 15 minutes
          keyGenerator: () => `auth:${identifier}`,
        })
        
        const result = await authLimiter.check({
          ip: identifier,
          headers: Object.fromEntries(request.headers.entries()),
        })
        
        if (!result.allowed) {
          return NextResponse.json(
            { 
              error: 'Too many login attempts. Please try again in 15 minutes.',
              retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
            },
            { 
              status: 429,
              headers: {
                'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
              }
            }
          )
        }
      } catch (error) {
        // Fallback rate limiting failed - allow request
      }
    }
    
    return null
  } catch (error) {
    // Rate limiting failed - allow request (fail open)
    return null
  }
}

