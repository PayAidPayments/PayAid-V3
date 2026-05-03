/**
 * Utility function to safely extract tenantId from params
 * Handles both string and array cases, and provides fallback to auth store
 */

import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

/**
 * Safely get tenantId from URL params with fallback to auth store
 * @returns tenantId as string or undefined
 */
export function useTenantId(): string | undefined {
  const params = useParams()
  const { tenant } = useAuthStore()
  
  // Handle both string and array cases (Next.js can return either)
  const tenantIdParam = params?.tenantId
  const tenantIdFromParams = Array.isArray(tenantIdParam) 
    ? tenantIdParam[0] 
    : (tenantIdParam as string | undefined)
  
  // Return valid string tenantId, or fallback to auth store
  return (tenantIdFromParams && typeof tenantIdFromParams === 'string' && tenantIdFromParams.trim()) 
    ? tenantIdFromParams 
    : (tenant?.id && typeof tenant.id === 'string' ? tenant.id : undefined)
}
