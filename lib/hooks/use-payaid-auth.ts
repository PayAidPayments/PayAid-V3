'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { decodeToken, JWTPayload } from '@/lib/auth/jwt'
import { useMemo } from 'react'

/**
 * Custom hook for PayAid authentication with module licensing
 * 
 * Provides:
 * - User and tenant info
 * - Licensed modules list
 * - Helper functions to check module access
 */
export function usePayAidAuth() {
  const { user, tenant, token } = useAuthStore()

  // Extract licensed modules from JWT token
  const licensedModules = useMemo(() => {
    if (!token) return []
    
    try {
      const decoded = decodeToken(token) as JWTPayload & {
        licensedModules?: string[]
        subscriptionTier?: string
      }
      return decoded.licensedModules || []
    } catch {
      // Fallback to tenant data if JWT decode fails
      return tenant?.licensedModules || []
    }
  }, [token, tenant])

  // Extract subscription tier from JWT token
  const subscriptionTier = useMemo(() => {
    if (!token) return 'free'
    
    try {
      const decoded = decodeToken(token) as JWTPayload & {
        licensedModules?: string[]
        subscriptionTier?: string
      }
      return decoded.subscriptionTier || 'free'
    } catch {
      // Fallback to tenant data if JWT decode fails
      return tenant?.subscriptionTier || 'free'
    }
  }, [token, tenant])

  /**
   * Check if user has access to a specific module
   */
  const hasModule = (moduleId: string): boolean => {
    return licensedModules.includes(moduleId)
  }

  /**
   * Check if user has access to any of the provided modules
   */
  const hasAnyModule = (moduleIds: string[]): boolean => {
    return moduleIds.some(id => licensedModules.includes(id))
  }

  /**
   * Check if user has access to all of the provided modules
   */
  const hasAllModules = (moduleIds: string[]): boolean => {
    return moduleIds.every(id => licensedModules.includes(id))
  }

  return {
    user,
    tenant,
    token,
    licensedModules,
    subscriptionTier,
    hasModule,
    hasAnyModule,
    hasAllModules,
    isAuthenticated: !!user && !!tenant,
  }
}
