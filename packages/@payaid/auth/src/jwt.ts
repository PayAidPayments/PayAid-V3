import jwt, { SignOptions } from 'jsonwebtoken'

const JWT_SECRET: string = process.env.JWT_SECRET || 'change-me-in-production'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h'

export interface JWTPayload {
  userId: string
  tenantId: string
  email: string
  role: string
  // Module licensing (Phase 1)
  licensedModules?: string[] // ['crm', 'invoicing', 'whatsapp', etc.]
  subscriptionTier?: string // 'free', 'starter', 'professional', 'enterprise'
}

export function signToken(payload: JWTPayload): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured')
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions)
}

export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch (error) {
    throw new Error('Invalid or expired token')
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch {
    return null
  }
}
