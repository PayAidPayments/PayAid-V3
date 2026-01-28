'use client'

/**
 * Phase 2: Module Context
 * Provides module context and navigation throughout the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { 
  getEnabledModules, 
  getAccessibleRoutes, 
  hasModuleAccess,
  type ModuleDefinition 
} from '@/lib/modules/moduleRegistry'

interface ModuleContextType {
  currentModule: string | null
  setCurrentModule: (moduleId: string | null) => void
  enabledModules: ModuleDefinition[]
  accessibleRoutes: ReturnType<typeof getAccessibleRoutes>
  hasAccess: (moduleId: string) => boolean
  isLoading: boolean
}

const ModuleContext = createContext<ModuleContextType | undefined>(undefined)

export function ModuleProvider({ children }: { children: React.ReactNode }) {
  // Get auth store values - Zustand handles SSR automatically
  const { user, tenant, isAuthenticated } = useAuthStore()

  const [currentModule, setCurrentModule] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const enabledModules = React.useMemo(() => {
    if (!tenant) return []
    try {
      // Get roles from user if available, otherwise use empty array
      const userRoles = (user as any)?.roles || []
      return getEnabledModules(tenant, userRoles)
    } catch (error) {
      console.error('Error getting enabled modules:', error)
      return []
    }
  }, [tenant, user])

  const accessibleRoutes = React.useMemo(() => {
    if (!user || !tenant) return []
    try {
      // Get roles and permissions from user if available
      const userRoles = (user as any)?.roles || []
      const userPermissions = (user as any)?.permissions || []
      return getAccessibleRoutes(
        {
          roles: userRoles,
          permissions: userPermissions,
        },
        tenant
      )
    } catch (error) {
      console.error('Error getting accessible routes:', error)
      return []
    }
  }, [user, tenant])

  const hasAccess = React.useCallback((moduleId: string): boolean => {
    if (!user || !tenant) return false
    try {
      // Get roles and permissions from user if available
      const userRoles = (user as any)?.roles || []
      const userPermissions = (user as any)?.permissions || []
      return hasModuleAccess(moduleId, {
        roles: userRoles,
        permissions: userPermissions,
      }, tenant)
    } catch (error) {
      console.error('Error checking module access:', error)
      return false
    }
  }, [user, tenant])

  // Auto-detect current module from URL
  useEffect(() => {
    if (typeof window === 'undefined') return

    const path = window.location.pathname
    const moduleMatch = path.match(/^\/([^\/]+)/)
    
    if (moduleMatch) {
      const moduleId = moduleMatch[1]
      if (hasAccess(moduleId)) {
        setCurrentModule(moduleId)
      }
    }
  }, [hasAccess])

  // Set loading to false once we have user/tenant data or if not authenticated
  useEffect(() => {
    if (isAuthenticated && user && tenant) {
      setIsLoading(false)
    } else if (!isAuthenticated) {
      // If not authenticated, still set loading to false to allow component to render
      setIsLoading(false)
    }
  }, [isAuthenticated, user, tenant])

  const value: ModuleContextType = {
    currentModule,
    setCurrentModule,
    enabledModules,
    accessibleRoutes,
    hasAccess,
    isLoading,
  }

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  )
}

export function useModule() {
  const context = useContext(ModuleContext)
  if (context === undefined) {
    throw new Error('useModule must be used within a ModuleProvider')
  }
  return context
}
