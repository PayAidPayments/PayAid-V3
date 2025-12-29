'use client'

import { useAuthStore } from '@/lib/stores/auth'
import { decodeToken, JWTPayload } from '@/lib/auth/jwt'
import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'

/**
 * Custom hook for PayAid authentication with module licensing
 * 
 * Provides:
 * - User and tenant info
 * - Licensed modules list (always from database, not stale token)
 * - Helper functions to check module access
 */
export function usePayAidAuth() {
  const { user, tenant, token } = useAuthStore()
  const [modulesFromApi, setModulesFromApi] = useState<string[] | null>(null)

  // Fetch latest modules from API (database is source of truth)
  const { data: userData } = useQuery({
    queryKey: ['auth-me', token],
    queryFn: async () => {
      if (!token) return null
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) return null
      return response.json()
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    retry: 1,
  })

  // Update modules when API data is fetched and sync to auth store
  useEffect(() => {
    if (userData?.tenant) {
      setModulesFromApi(userData.tenant.licensedModules || [])
      
      // Also update auth store with latest tenant data (including modules)
      // This ensures the store has the most up-to-date information
      useAuthStore.setState({
        tenant: {
          ...useAuthStore.getState().tenant,
          ...userData.tenant,
          licensedModules: userData.tenant.licensedModules || [],
          subscriptionTier: userData.tenant.subscriptionTier || 'free',
        },
      })
    }
  }, [userData])

  // Extract licensed modules - prioritize database (API) over token
  const licensedModules = useMemo(() => {
    // Priority 1: Database data from API (most up-to-date)
    if (modulesFromApi && modulesFromApi.length > 0) {
      return modulesFromApi
    }
    
    // Priority 2: Tenant data from auth store (if available)
    if (tenant?.licensedModules && tenant.licensedModules.length > 0) {
      return tenant.licensedModules
    }
    
    // Priority 3: JWT token (may be stale, but better than nothing)
    if (token) {
      try {
        const decoded = decodeToken(token) as JWTPayload & {
          licensedModules?: string[]
          subscriptionTier?: string
        }
        if (decoded.licensedModules && decoded.licensedModules.length > 0) {
          return decoded.licensedModules
        }
      } catch {
        // Token decode failed, continue to fallback
      }
    }
    
    // Fallback: empty array
    return []
  }, [modulesFromApi, tenant?.licensedModules, token])

  // Extract subscription tier - prioritize database over token
  const subscriptionTier = useMemo(() => {
    // Priority 1: Database data from API
    if (userData?.tenant?.subscriptionTier) {
      return userData.tenant.subscriptionTier
    }
    
    // Priority 2: Tenant data from auth store
    if (tenant?.subscriptionTier) {
      return tenant.subscriptionTier
    }
    
    // Priority 3: JWT token
    if (token) {
      try {
        const decoded = decodeToken(token) as JWTPayload & {
          licensedModules?: string[]
          subscriptionTier?: string
        }
        if (decoded.subscriptionTier) {
          return decoded.subscriptionTier
        }
      } catch {
        // Token decode failed
      }
    }
    
    // Fallback
    return 'free'
  }, [userData?.tenant?.subscriptionTier, tenant?.subscriptionTier, token])

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
