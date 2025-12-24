/**
 * Utility functions for tenant-aware routing
 * All dashboard routes should include the tenant identifier
 */

import { useAuthStore } from '@/lib/stores/auth'

/**
 * Get the current tenant ID from auth store
 */
export function getTenantId(): string | null {
  const { tenant } = useAuthStore.getState()
  return tenant?.id || null
}

/**
 * Generate a tenant-aware dashboard URL
 * @param path - The dashboard path (e.g., '/contacts', '/invoices/new')
 * @returns Full path with tenant ID (e.g., '/dashboard/[tenantId]/contacts')
 */
export function getDashboardUrl(path: string): string {
  if (!path || typeof path !== 'string') {
    path = '/dashboard'
  }
  
  const tenantId = getTenantId()
  if (!tenantId) {
    // Fallback to path without tenantId (will be handled by middleware)
    return `/dashboard${path.startsWith('/') ? path : '/' + path}`
  }
  
  // Remove leading /dashboard if present
  const cleanPath = path.replace(/^\/dashboard\/?/, '')
  
  return `/dashboard/${tenantId}${cleanPath ? '/' + cleanPath : ''}`
}

/**
 * Extract tenant ID from a dashboard URL
 * @param pathname - Full pathname (e.g., '/dashboard/[tenantId]/contacts')
 * @returns Tenant ID or null
 */
export function extractTenantIdFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([a-z0-9]{20,})/)
  return match ? match[1] : null
}

/**
 * Remove tenant ID from a dashboard URL to get the relative path
 * @param pathname - Full pathname (e.g., '/dashboard/[tenantId]/contacts')
 * @returns Relative path (e.g., '/contacts')
 */
export function getRelativeDashboardPath(pathname: string): string {
  const match = pathname.match(/^\/dashboard\/[a-z0-9]{20,}(.*)$/)
  return match ? match[1] || '/' : pathname
}
