/**
 * Utility function to safely extract tenantId from params
 * Handles both string and array cases, and provides fallback to auth store
 */

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

/**
 * Tenant segment from the current route `[tenantId]` param, with auth-store fallback.
 * Prefer slug for the same canonical URLs as home; uses internal id only when slug is absent.
 * For APIs that require the database primary key, use `tenant?.id` from `useAuthStore`.
 */
export function useTenantId(): string | undefined {
  const params = useParams()
  const { tenant } = useAuthStore()
  
  // Handle both string and array cases (Next.js can return either)
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? tenantIdParam[0] 
    : (tenantIdParam as string | undefined)
  
  const fromRoute =
    tenantIdFromParams && typeof tenantIdFromParams === 'string' ? tenantIdFromParams.trim() : ''
  if (fromRoute) return fromRoute

  return getTenantRouteKey(tenant) ?? undefined
}
