import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_SECRET: string = (process.env.JWT_SECRET || 'change-me-in-production').trim()
const JWT_REFRESH_SECRET: string = (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'change-me-in-production').trim()
const JWT_EXPIRES_IN: string = (process.env.JWT_EXPIRES_IN || '15m').trim() // 15 minutes for access token
const JWT_REFRESH_EXPIRES_IN: string = (process.env.JWT_REFRESH_EXPIRES_IN || '7d').trim() // 7 days for refresh token

/**
 * Phase 1: Enhanced JWT Payload Structure
 * Based on PayAid V3 Architecture Document
 */
export interface JWTPayload {
  // Standard claims
  sub: string // User ID (JWT standard)
  email: string
  tenant_id: string
  tenant_slug?: string
  
  // Roles and Permissions
  roles: string[] // ['admin', 'manager', 'user']
  permissions: string[] // ['crm:read', 'crm:create_lead', 'hr:read']
  
  // Module Access
  modules: string[] // Enabled modules for tenant: ['crm', 'hr', 'accounting']
  
  // Legacy fields (for backward compatibility)
  userId?: string
  tenantId?: string
  role?: string
  licensedModules?: string[]
  subscriptionTier?: string
  
  // JWT standard claims
  iat?: number
  exp?: number
  iss?: string // Issuer
  aud?: string // Audience
}

export interface RefreshTokenPayload {
  sub: string // User ID
  tenant_id: string
  type: 'refresh'
  iat?: number
  exp?: number
}

/**
 * Input type for signToken - accepts both new and legacy formats
 */
export type SignTokenInput = 
  | JWTPayload
  | {
      userId?: string
      tenantId?: string
      email: string
      role?: string
      licensedModules?: string[]
      subscriptionTier?: string
      sub?: string
      tenant_id?: string
      roles?: string[]
      permissions?: string[]
      modules?: string[]
      tenant_slug?: string
    }

/**
 * Generate access token (15 minutes expiry)
 * Includes roles, permissions, and modules
 */
export function signToken(payload: SignTokenInput): string {
  if (!JWT_SECRET || JWT_SECRET === 'change-me-in-production') {
    throw new Error('JWT_SECRET is not configured')
  }
  
  // Normalize payload to include both standard and legacy fields
  const p = payload as any
  const normalizedPayload: JWTPayload = {
    ...payload,
    // Ensure standard JWT claims
    sub: p.sub || p.userId || '',
    tenant_id: p.tenant_id || p.tenantId || '',
    // Ensure arrays are present
    roles: p.roles || (p.role ? [p.role] : []),
    permissions: p.permissions || [],
    modules: p.modules || p.licensedModules || [],
    // Legacy compatibility
    userId: p.userId || p.sub,
    tenantId: p.tenantId || p.tenant_id,
    role: p.role || p.roles?.[0] || 'user',
    licensedModules: p.licensedModules || p.modules || [],
  }
  
  // Validate and normalize expiresIn value
  let expiresIn: string | number = JWT_EXPIRES_IN
  if (!expiresIn || expiresIn.trim() === '') {
    expiresIn = '15m' // Default: 15 minutes
  } else {
    expiresIn = expiresIn.trim()
  }
  
  return jwt.sign(normalizedPayload, JWT_SECRET, {
    expiresIn: expiresIn,
    issuer: process.env.JWT_ISSUER || 'payaid.store',
    audience: p.tenant_slug ? `${p.tenant_slug}.payaid.store` : 'payaid.store',
  } as SignOptions)
}

/**
 * Generate refresh token (7 days expiry)
 */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  if (!JWT_REFRESH_SECRET || JWT_REFRESH_SECRET === 'change-me-in-production') {
    throw new Error('JWT_REFRESH_SECRET is not configured')
  }
  
  let expiresIn: string | number = JWT_REFRESH_EXPIRES_IN
  if (!expiresIn || expiresIn.trim() === '') {
    expiresIn = '7d' // Default: 7 days
  } else {
    expiresIn = expiresIn.trim()
  }
  
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: expiresIn,
  } as SignOptions)
}

/**
 * Verify access token
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload
  } catch (error) {
    throw new Error('Invalid or expired refresh token')
  }
}

/**
 * Decode token without verification (for inspection)
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}

/**
 * Extract token from request headers
 */
export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }
  return null
}
