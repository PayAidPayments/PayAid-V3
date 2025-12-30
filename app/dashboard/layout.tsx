'use client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { NewsSidebar } from '@/components/news/NewsSidebar'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { cn } from '@/lib/utils/cn'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const { tenant, token, fetchUser } = useAuthStore()
  
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
    window.addEventListener('orientationchange', handleResize)
    
    // Also handle the orientationchange event with a slight delay
    // as some browsers need time to update dimensions
    const handleOrientationChange = () => {
      setTimeout(handleResize, 100)
    }
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
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
      <div className="flex h-screen bg-gray-50">
        {/* Mobile/Tablet Portrait Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <div className={cn(
          'sidebar-container',
          'fixed lg:fixed',
          'inset-y-0 left-0',
          'z-50 lg:z-auto',
          'w-64',
          'transform',
          'transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden w-full relative">
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 transition-all duration-300">
            {children}
          </main>
          
          {/* News Sidebar - Right side */}
          <NewsSidebar />
        </div>
      </div>
    </ProtectedRoute>
  )
}
