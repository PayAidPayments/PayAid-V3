'use client'

/**
 * PayAid V3 – usePermissions hook
 * Wraps RBAC can() with React hook semantics (user from auth store).
 */

import { useMemo } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { can, getUserPermissions, isSuperAdmin, isBusinessAdmin } from '@/lib/rbac'
import type { AuthUser, Permission } from '@/types/auth'

/** Client-safe decode of JWT payload (no server imports) */
function decodeJwtPayload(token: string): { roles?: string[]; role?: string } | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as { roles?: string[]; role?: string }
  } catch {
    return null
  }
}

function toAuthUser(store: {
  user: { id: string; email: string; name: string | null; role: string; roles?: string[] } | null
  tenant: { id: string } | null
  token: string | null
}): AuthUser | null {
  if (!store.user) return null
  const u = store.user
  
  // Prefer store roles; fallback to JWT payload so roles show without re-login
  let roles = u.roles ?? (u.role ? [u.role] : [])
  if (store.token && roles.length === 0) {
    const decoded = decodeJwtPayload(store.token)
    if (decoded?.roles?.length) roles = decoded.roles
    else if (decoded?.role) roles = [decoded.role]
  }
  
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    roles: roles,
    permissions: [],
    tenantId: store.tenant?.id ?? undefined,
    tenant_id: store.tenant?.id ?? undefined,
  }
}

export function usePermissions(businessId?: string | null) {
  const user = useAuthStore((s) => s.user)
  const tenant = useAuthStore((s) => s.tenant)
  const token = useAuthStore((s) => s.token)
  const authUser = useMemo(
    () => toAuthUser({ user, tenant, token }),
    [user, tenant, token]
  )
  const tenantId = businessId ?? tenant?.id ?? null

  const canDo = useMemo(
    () => (permission: Permission) =>
      authUser ? can({ user: authUser, permission, businessId: tenantId }) : false,
    [authUser, tenantId]
  )

  const permissions = useMemo(
    () => (authUser ? getUserPermissions({ user: authUser, businessId: tenantId }) : []),
    [authUser, tenantId]
  )

  const superAdmin = useMemo(() => isSuperAdmin(authUser), [authUser])
  const businessAdmin = useMemo(
    () => isBusinessAdmin(authUser, tenantId),
    [authUser, tenantId]
  )

  return {
    user: authUser,
    can: canDo,
    permissions,
    isSuperAdmin: superAdmin,
    isBusinessAdmin: businessAdmin,
  }
}
