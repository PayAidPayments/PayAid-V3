/**
 * Verify JWT for Productivity proxy routes (office/drive).
 * Token can come from query string (iframe-friendly) or Authorization header.
 */

import { NextRequest } from 'next/server'
import { verifyToken, JWTPayload } from '@/lib/auth/jwt'

const PRODUCTIVITY_MODULE_IDS = [
  'productivity',
  'spreadsheet',
  'docs',
  'drive',
  'slides',
  'meet',
  'pdf',
]

export interface ProxyAuthResult {
  userId: string
  tenantId: string
}

/**
 * Verify token and ensure requester has access to the given tenantId.
 * Token can be in query (?token=) or Authorization: Bearer.
 */
export function verifyProductivityProxyToken(
  request: NextRequest,
  tenantIdFromQuery: string
): ProxyAuthResult {
  const url = new URL(request.url)
  const tokenFromQuery = url.searchParams.get('token')
  const authHeader = request.headers.get('authorization')
  const tokenFromHeader = authHeader?.startsWith('Bearer ')
    ? authHeader.substring(7)
    : null
  const token = tokenFromQuery ?? tokenFromHeader

  if (!token) {
    throw new Error('Missing token')
  }

  let payload: JWTPayload
  try {
    payload = verifyToken(token)
  } catch {
    throw new Error('Invalid or expired token')
  }

  const payloadTenantId = payload.tenantId ?? payload.tenant_id
  if (!payloadTenantId) {
    throw new Error('Invalid token: missing tenant')
  }

  if (payloadTenantId !== tenantIdFromQuery) {
    throw new Error('Tenant mismatch')
  }

  const licensedModules = payload.licensedModules ?? payload.modules ?? []
  const subscriptionTier = payload.subscriptionTier ?? 'free'
  const isFreeTierNoModules = subscriptionTier === 'free' && licensedModules.length === 0
  const hasProductivity =
    isFreeTierNoModules ||
    PRODUCTIVITY_MODULE_IDS.some((id) => licensedModules.includes(id))

  if (!hasProductivity) {
    throw new Error('Productivity module is not licensed for this tenant')
  }

  const userId = payload.sub ?? payload.userId ?? ''
  if (!userId) {
    throw new Error('Invalid token: missing user')
  }

  return { userId, tenantId: payloadTenantId }
}
