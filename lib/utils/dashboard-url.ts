/**
 * Utility functions for generating tenant-aware dashboard URLs
 * Use these functions throughout the app to ensure tenant ID is preserved
 */

import { useAuthStore } from '@/lib/stores/auth'

/**
 * Get tenant ID from auth store (client-side only)
 */
function getTenantId(): string | null {
  if (typeof window === 'undefined') return null
  const { tenant } = useAuthStore.getState()
  return tenant?.id || null
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
  
  const tenantId = getTenantId()
  if (!tenantId) {
    // Fallback to path without tenantId (middleware will add it)
    return `/dashboard${path.startsWith('/') ? path : '/' + path}`
  }
  
  // Remove leading /dashboard if present
  const cleanPath = path.replace(/^\/dashboard\/?/, '')
  
  return `/dashboard/${tenantId}${cleanPath ? '/' + cleanPath : ''}`
}

/**
 * React hook version for use in components
 * Automatically updates when tenant changes
 */
export function useDashboardUrl(path: string): string {
  const { tenant } = useAuthStore()
  const tenantId = tenant?.id
  
  if (!tenantId) {
    return `/dashboard${path.startsWith('/') ? path : '/' + path}`
  }
  
  const cleanPath = path.replace(/^\/dashboard\/?/, '')
  return `/dashboard/${tenantId}${cleanPath ? '/' + cleanPath : ''}`
}

