/**
 * Server-side helper: ensure request is from a Super Admin.
 * Use in API routes or server components that need SUPER_ADMIN.
 * Returns decoded JWT or throws/returns redirect.
 */

import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth/jwt'
import type { JWTPayload } from '@/lib/auth/jwt'

const SUPER_ADMIN_ROLES = ['SUPER_ADMIN', 'super_admin']

export async function requireSuperAdmin(): Promise<JWTPayload> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) {
    throw new Error('Unauthorized')
  }
  const decoded = verifyToken(token)
  const roles = decoded.roles ?? (decoded.role ? [decoded.role] : [])
  const isSuperAdmin = roles.some((r: string) => SUPER_ADMIN_ROLES.includes(r))
  if (!isSuperAdmin) {
    throw new Error('Forbidden')
  }
  return decoded
}
