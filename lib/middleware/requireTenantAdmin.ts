/**
 * Server-side helper: ensure request is from a tenant Business Admin (or Super Admin).
 * Use in API routes or server components for /admin/*.
 */

import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import type { JWTPayload } from '@/lib/auth/jwt'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']
const TENANT_ADMIN_ROLES = ['BUSINESS_ADMIN', 'business_admin', 'admin']

export async function requireTenantAdmin(): Promise<JWTPayload> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) throw new Error('Unauthorized')
  const decoded = verifyToken(token)
  const roles = decoded.roles ?? (decoded.role ? [decoded.role] : [])
  const isSuperAdmin = roles.some((r: string) => SUPER_ADMIN_ROLES.includes(r))
  const isTenantAdmin = roles.some((r: string) => TENANT_ADMIN_ROLES.includes(r))
  if (!isSuperAdmin && !isTenantAdmin) throw new Error('Forbidden')
  return decoded
}
