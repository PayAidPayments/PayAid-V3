/**
 * Security Middleware (Layer 4)
 * Rate limiting, API key validation, and security checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { ipRateLimiter } from '../middleware/rate-limit'
import { applyUpstashRateLimit, applyUpstashAuthRateLimit } from '../middleware/upstash-rate-limit'
import { validateAPIKey } from '../security/api-keys'

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
    if (typeof EdgeRuntime === 'undefined' && 
        (!process.env.NEXT_RUNTIME || process.env.NEXT_RUNTIME !== 'edge')) {
      const clientIP = 
        request.headers.get('cf-connecting-ip') || 
        request.headers.get('x-forwarded-for')?.split(',')[0] || 
        'unknown'
      
      try {
        const result = await ipRateLimiter.check({
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
  const authHeader = request.headers.get('authorization')
  const clientIP = 
    request.headers.get('cf-connecting-ip') || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    'unknown'
  
  const result = await validateAPIKey(authHeader, clientIP)
  
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
    if (typeof EdgeRuntime === 'undefined' && 
        (!process.env.NEXT_RUNTIME || process.env.NEXT_RUNTIME !== 'edge')) {
      try {
        const authLimiter = new (await import('../middleware/rate-limit')).RateLimiter({
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

