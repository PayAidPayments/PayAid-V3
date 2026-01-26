/**
 * Request Logging Middleware
 * Zero-cost enhancement for observability
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logging/structured-logger'
import { generateRequestId } from '@/lib/errors'

export interface RequestContext {
  requestId: string
  method: string
  path: string
  tenantId?: string
  userId?: string
  ip?: string
  userAgent?: string
}

/**
 * Request logging middleware
 */
export function withRequestLogging(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const requestId = generateRequestId()
    const startTime = Date.now()
    const url = new URL(request.url)
    const path = url.pathname

    // Extract context
    const context: RequestContext = {
      requestId,
      method: request.method,
      path,
      ip: request.ip || request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    }

    // Try to extract tenant/user from headers or token
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      // Token parsing would go here (without exposing sensitive data)
    }

    logger.info(`Request started: ${request.method} ${path}`, {
      ...context,
      query: Object.fromEntries(url.searchParams.entries()),
    })

    try {
      const response = await handler(request, context)
      const duration = Date.now() - startTime

      logger.logRequest(request.method, path, response.status, duration, {
        requestId,
        tenantId: context.tenantId,
        userId: context.userId,
      })

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId)
      response.headers.set('X-Response-Time', `${duration}ms`)

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error(
        `Request failed: ${request.method} ${path}`,
        error instanceof Error ? error : undefined,
        {
          ...context,
          duration,
        }
      )

      throw error
    }
  }
}
