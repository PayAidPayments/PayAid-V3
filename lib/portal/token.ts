// @ts-nocheck
/**
 * Customer Portal: sign and verify tokens for contact/customer access.
 */

import jwt from 'jsonwebtoken'

const SECRET = (process.env.JWT_SECRET || process.env.PORTAL_SECRET || 'change-me-in-production').trim()
const EXPIRY = process.env.PORTAL_TOKEN_EXPIRY || '7d'

export interface PortalTokenPayload {
  tenantId: string
  contactId: string
  iat?: number
  exp?: number
}

export function signPortalToken(tenantId: string, contactId: string): string {
  return jwt.sign(
    { tenantId, contactId } as PortalTokenPayload,
    SECRET,
    { expiresIn: EXPIRY }
  )
}

export function verifyPortalToken(token: string): PortalTokenPayload {
  try {
    const decoded = jwt.verify(token, SECRET) as PortalTokenPayload
    if (!decoded.tenantId || !decoded.contactId) throw new Error('Invalid portal token payload')
    return decoded
  } catch {
    throw new Error('Invalid or expired portal token')
  }
}
