/**
 * Utility functions for generating tenant-aware dashboard URLs
 * Use these functions throughout the app to ensure tenant ID is preserved
 */

import { useAuthStore } from '@/lib/stores/auth'
import { getRedirectForDashboardPath } from '@/lib/dashboard-redirects'
import { getTenantRouteKey } from '@/lib/utils/tenant-route-key'

/**
 * Get tenant route key from auth store (client-side only)
 */
function getTenantRoute(): string | null {
  if (typeof window === 'undefined') return null
  const { tenant } = useAuthStore.getState()
  return getTenantRouteKey(tenant)
}

/**
 * Generate a tenant-aware dashboard URL
 * @param path - The dashboard path (e.g., '/contacts', '/invoices/new', '/websites/123')
 * @returns Full path with tenant ID (e.g., '/dashboard/[tenantId]/contacts')
 * 
 * Usage in components:
 * ```tsx
 * import { getDashboardUrl } from '@/lib/utils/dashboard-url'
 * 
 * const url = getDashboardUrl('/websites')
 * <Link href={url}>Websites</Link>
 * ```
 */
export function getDashboardUrl(path: string): string {
  if (!path || typeof path !== 'string') {
    path = '/dashboard'
  }
  
  const tenantRoute = getTenantRoute()
  if (!tenantRoute) {
    // Fallback to path without tenantId (middleware will add it)
    return `/dashboard${path.startsWith('/') ? path : '/' + path}`
  }

  // Remove leading /dashboard if present.
  const cleanPath = path.replace(/^\/dashboard\/?/, '')
  const dashboardPath = `/dashboard${cleanPath ? '/' + cleanPath : ''}`
  const decoupledPath = getRedirectForDashboardPath(dashboardPath, tenantRoute)

  // Prefer direct decoupled routes to avoid extra client-side redirect hop.
  return decoupledPath ?? `/dashboard/${tenantRoute}${cleanPath ? '/' + cleanPath : ''}`
}

/**
 * React hook version for use in components
 * Automatically updates when tenant changes
 */
export function useDashboardUrl(path: string): string {
  const { tenant } = useAuthStore()
  const tenantRoute = getTenantRouteKey(tenant)
  
  if (!tenantRoute) {
    return `/dashboard${path.startsWith('/') ? path : '/' + path}`
  }

  const cleanPath = path.replace(/^\/dashboard\/?/, '')
  const dashboardPath = `/dashboard${cleanPath ? '/' + cleanPath : ''}`
  const decoupledPath = getRedirectForDashboardPath(dashboardPath, tenantRoute)

  // Prefer direct decoupled routes to avoid extra client-side redirect hop.
  return decoupledPath ?? `/dashboard/${tenantRoute}${cleanPath ? '/' + cleanPath : ''}`
}

