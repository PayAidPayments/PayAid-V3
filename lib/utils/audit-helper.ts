import { NextRequest } from 'next/server'

/**
 * Extract client IP address from request
 */
export function getClientIp(request: NextRequest): string | null {
  // Check various headers for IP (in order of preference)
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[0]?.trim() || null
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp

  const cfConnectingIp = request.headers.get('cf-connecting-ip')
  if (cfConnectingIp) return cfConnectingIp

  // Fallback to connection remote address (if available)
  return null
}

/**
 * Extract user agent from request
 */
export function getUserAgent(request: NextRequest): string | null {
  return request.headers.get('user-agent') || null
}

/**
 * Create audit log data with IP and user agent
 */
export function createAuditLogData(
  entityType: string,
  entityId: string,
  changedBy: string,
  changeSummary: string,
  tenantId: string,
  request?: NextRequest,
  beforeSnapshot?: any,
  afterSnapshot?: any
) {
  return {
    entityType,
    entityId,
    changedBy,
    changeSummary,
    tenantId,
    beforeSnapshot: beforeSnapshot || null,
    afterSnapshot: afterSnapshot || null,
    ipAddress: request ? getClientIp(request) : null,
    userAgent: request ? getUserAgent(request) : null,
  }
}
