/**
 * Security Middleware (Layer 4)
 * Rate limiting, API key validation, and security checks
 */

import { NextRequest, NextResponse } from 'next/server'
import { ipRateLimiter } from '../middleware/rate-limit'
import { validateAPIKey } from '../security/api-keys'

/**
 * Apply rate limiting to requests
 */
export async function applyRateLimit(request: NextRequest): Promise<NextResponse | null> {
  try {
    const clientIP = 
      request.headers.get('cf-connecting-ip') || 
      request.headers.get('x-forwarded-for')?.split(',')[0] || 
      'unknown'
    
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
    
    return null
  } catch (error) {
    // Rate limiting failed (e.g., Redis not available) - allow request (fail open)
    // This prevents middleware from crashing the entire application
    console.warn('Rate limiting error (allowing request):', error)
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
    // Use stricter limits for auth endpoints
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
    
    return null
  } catch (error) {
    // Rate limiting failed - allow request (fail open)
    // This prevents middleware from crashing the entire application
    console.warn('Auth rate limiting error (allowing request):', error)
    return null
  }
}

