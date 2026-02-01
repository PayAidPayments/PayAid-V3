'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/layout/sidebar'
import { CRMSidebar } from '@/components/layout/sidebars/CRMSidebar'
import { FinanceSidebar } from '@/components/layout/sidebars/FinanceSidebar'
import { SalesSidebar } from '@/components/layout/sidebars/SalesSidebar'
import { Header } from '@/components/layout/header'
import { NewsSidebar } from '@/components/news/NewsSidebar'
import { CRMTopBar } from '@/components/modules/CRMTopBar'
import { FinanceTopBar } from '@/components/modules/FinanceTopBar'
import { SalesTopBar } from '@/components/modules/SalesTopBar'
import { HRTopBar } from '@/components/modules/HRTopBar'
import { MarketingTopBar } from '@/components/modules/MarketingTopBar'
import { ProjectsTopBar } from '@/components/modules/ProjectsTopBar'
import { InventoryTopBar } from '@/components/modules/InventoryTopBar'
import { useParams, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { cn } from '@/lib/utils/cn'
import { detectModuleFromPath } from '@/lib/utils/module-detection'
import { validateSSOTokenFromQuery } from '@/lib/sso/token-manager'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const { tenant, token, fetchUser } = useAuthStore()
  
  // Validate SSO token from query (if coming from another module)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ssoToken = validateSSOTokenFromQuery()
      if (ssoToken) {
        // Token validated and stored, continue with normal flow
      }
    }
  }, [])

  // Detect current module from pathname
  const currentModule = detectModuleFromPath(pathname || '')
  
  // Check if this is a module route with its own layout (e.g., /finance/[tenantId]/Home)
  // These routes have their own ModuleTopBar in their layout files, so we shouldn't render one here
  const isModuleRouteWithLayout = pathname && (
    pathname.match(/^\/(crm|finance|sales|marketing|hr|projects|inventory|analytics|communication|education|healthcare|manufacturing|retail|ai-studio|docs|drive|meet|pdf|slides|spreadsheet|ai-chat|ai-cofounder|ai-insights|knowledge-rag|logo-generator|website-builder|appointments|compliance|contracts|help-center|lms|industry-intelligence|workflow-automation)\/[^/]+\//)
  )
  
  // Get module-specific top bar (only for dashboard routes, not module routes with their own layouts)
  const getModuleTopBar = () => {
    // Skip top bar if this route has its own module layout
    if (isModuleRouteWithLayout) {
      return null
    }
    
    switch (currentModule) {
      case 'crm':
        return <CRMTopBar />
      case 'finance':
        return <FinanceTopBar />
      case 'sales':
        return <SalesTopBar />
      case 'hr':
        return <HRTopBar />
      case 'marketing':
        return <MarketingTopBar />
      case 'projects':
        return <ProjectsTopBar />
      case 'inventory':
        return <InventoryTopBar />
      default:
        return null // Use default header for dashboard
    }
  }
  
  const ModuleTopBar = getModuleTopBar()
  
  // Debug logging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Module Detection]', {
        pathname,
        currentModule,
        hasTopBar: !!ModuleTopBar,
        willShow: currentModule === 'crm' ? 'CRM Sidebar' : currentModule === 'finance' ? 'Finance Sidebar' : currentModule === 'sales' ? 'Sales Sidebar' : 'Default Sidebar'
      })
    }
  }, [pathname, currentModule, ModuleTopBar])
  
  // Get the appropriate sidebar component
  const getSidebarComponent = () => {
    switch (currentModule) {
      case 'crm':
        return CRMSidebar
      case 'finance':
        return FinanceSidebar
      case 'sales':
        return SalesSidebar
      default:
        return Sidebar // Default sidebar for main dashboard and other modules
    }
  }
  
  const SidebarComponent = getSidebarComponent()
  
  // Helper function to determine if sidebar should be open based on viewport
  const shouldSidebarBeOpen = (): boolean => {
    if (typeof window === 'undefined') return true // Default to open for SSR
    const width = window.innerWidth
    const height = window.innerHeight
    const isLandscape = width > height
    
    // Desktop: always allow sidebar (>= 1024px)
    if (width >= 1024) return true
    
    // Tablet landscape (768px - 1023px, landscape): allow sidebar
    if (width >= 768 && width < 1024 && isLandscape) return true
    
    // Tablet portrait or mobile: sidebar closed by default
    return false
  }
  
  // Start closed on mobile/tablet portrait, open on desktop/tablet landscape
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === 'undefined') return true // Default to open for SSR
    const width = window.innerWidth
    const height = window.innerHeight
    const isLandscape = width > height
    
    // Desktop: always allow sidebar (>= 1024px)
    if (width >= 1024) return true
    
    // Tablet landscape (768px - 1023px, landscape): allow sidebar
    if (width >= 768 && width < 1024 && isLandscape) return true
    
    // Tablet portrait or mobile: sidebar closed by default
    return false
  })

  // Extract tenantId from URL params
  const tenantIdFromUrl = params?.tenantId as string | undefined

  // Refresh tenant data on mount to get latest modules
  useEffect(() => {
    if (token && !tenant?.licensedModules?.length) {
      // If tenant doesn't have modules, fetch latest from API
      fetchUser().catch(() => {
        // Silently fail - user might not be authenticated
      })
    }
  }, [token, tenant?.licensedModules?.length, fetchUser])

  // Verify tenantId matches logged-in tenant
  useEffect(() => {
    if (tenant?.id && tenantIdFromUrl && tenant.id !== tenantIdFromUrl) {
      // Tenant mismatch - redirect to correct tenant dashboard
      router.replace(`/dashboard/${tenant.id}`)
    }
  }, [tenant?.id, tenantIdFromUrl, router])

  // Handle window resize and orientation changes
  useEffect(() => {
    const handleResize = () => {
      const shouldOpen = shouldSidebarBeOpen()
      // Only auto-close on resize if switching to mobile/portrait
      // Don't auto-open to preserve user preference
      if (!shouldOpen && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    // Listen for both resize and orientation change events
    window.addEventListener('resize', handleResize)
    
    // Handle orientation change with delay to allow browser to update dimensions
    const handleOrientationChange = () => {
      // Use a longer delay for orientation changes as browsers need time to update
      setTimeout(() => {
        const shouldOpen = shouldSidebarBeOpen()
        if (!shouldOpen && sidebarOpen) {
          setSidebarOpen(false)
        }
      }, 200)
    }
    
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [sidebarOpen])

  // Expose sidebar state to main element via CSS classes for dynamic padding
  useEffect(() => {
    const main = document.querySelector('main')
    if (main) {
      // Remove both classes first
      main.classList.remove('main-sidebar-open', 'main-sidebar-closed')
      
      // Add appropriate class based on state
      if (sidebarOpen) {
        main.classList.add('main-sidebar-open')
      } else {
        main.classList.add('main-sidebar-closed')
      }
    }
    
    // Cleanup on unmount
    return () => {
      const main = document.querySelector('main')
      if (main) {
        main.classList.remove('main-sidebar-open', 'main-sidebar-closed')
      }
    }
  }, [sidebarOpen])

  // Close sidebar when clicking outside on mobile/tablet
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (sidebarOpen && !target.closest('.sidebar-container') && !target.closest('.mobile-menu-button') && !target.closest('.desktop-menu-button')) {
        // Close on mobile and tablet portrait when clicking outside
        if (typeof window !== 'undefined') {
          const width = window.innerWidth
          const height = window.innerHeight
          const isLandscape = width > height
          
          // Close on mobile (< 768px) or tablet portrait (< 1024px and portrait)
          if (width < 768 || (width < 1024 && !isLandscape)) {
            setSidebarOpen(false)
          }
        }
      }
    }

    if (sidebarOpen && typeof window !== 'undefined') {
      const width = window.innerWidth
      const height = window.innerHeight
      const isLandscape = width > height
      
      // Only add overlay and prevent scroll on mobile or tablet portrait
      if (width < 768 || (width < 1024 && !isLandscape)) {
        document.addEventListener('click', handleClickOutside)
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Mobile/Tablet Portrait Overlay - Only show on mobile and tablet portrait */}
        {sidebarOpen && (() => {
          if (typeof window === 'undefined') return null
          const width = window.innerWidth
          const height = window.innerHeight
          const isLandscape = width > height
          // Show overlay on mobile (< 768px) or tablet portrait (< 1024px and portrait)
          const shouldShowOverlay = width < 768 || (width < 1024 && !isLandscape)
          if (!shouldShowOverlay) return null
          
          return (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
          )
        })()}
        
        {/* Sidebar - Hidden when module top bar is active (decoupled architecture) */}
        {!ModuleTopBar && (
          <div className={cn(
            'sidebar-container',
            'fixed',
            'inset-y-0 left-0',
            'z-50',
            'w-64',
            'transform',
            'transition-transform duration-300 ease-in-out',
            // On desktop (>= 1024px), sidebar is always visible (no transform needed)
            // On tablet landscape (768-1023px, landscape), sidebar is always visible when open
            // On mobile/tablet portrait, sidebar slides in/out
            sidebarOpen 
              ? 'translate-x-0' 
              : '-translate-x-full lg:translate-x-0' // Desktop always shows, mobile/tablet slides
          )}>
            <SidebarComponent isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Main Content */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden relative transition-all duration-300",
          // Apply margin only if sidebar is shown (not when module top bar is active)
          !ModuleTopBar && sidebarOpen 
            ? "lg:ml-64 md:ml-64" // Desktop and tablet landscape
            : "lg:ml-0 md:ml-0"   // Mobile and tablet portrait (overlay mode) or module top bar active
        )}>
          {/* Use module-specific top bar if available, otherwise use default header */}
          {ModuleTopBar || <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 bg-gray-50 dark:bg-gray-900 transition-colors">
            {children}
          </main>
        </div>
        
        {/* News Sidebar - Right Side */}
        <NewsSidebar />
      </div>
    </ProtectedRoute>
  )
}
