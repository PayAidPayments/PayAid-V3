'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, token, fetchUser } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [rehydrated, setRehydrated] = useState(false)

  // Wait for component to mount (ensures localStorage is accessible)
  useEffect(() => {
    setMounted(true)
    
    // Check if Zustand has rehydrated by polling the store state
    const checkRehydration = () => {
      const state = useAuthStore.getState()
      
      // Check if we have a token in localStorage
      let hasTokenInStorage = false
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('auth-storage')
          if (stored) {
            const parsed = JSON.parse(stored)
            hasTokenInStorage = !!parsed.state?.token
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // If localStorage has token but state doesn't, rehydration isn't complete yet
      if (hasTokenInStorage && !state.token) {
        // Wait a bit more for Zustand to finish rehydrating
        setTimeout(checkRehydration, 50)
        return
      }
      
      // Rehydration complete
      setRehydrated(true)
      
      // If we have a token in storage but state shows not authenticated, 
      // assume authenticated to prevent redirect during rehydration
      if (hasTokenInStorage && !state.isAuthenticated) {
        useAuthStore.setState({ 
          isAuthenticated: true,
          isLoading: false 
        })
      }
    }
    
    // Start checking after a brief delay to let Zustand start rehydration
    setTimeout(checkRehydration, 50)
  }, [])

  useEffect(() => {
    // Wait for component to mount and rehydration to complete
    if (!mounted || !rehydrated) return

    // Add a small delay to ensure state is stable after rehydration
    const timeoutId = setTimeout(() => {
      // Get current state after rehydration
      const currentState = useAuthStore.getState()
      const currentToken = currentState.token

      // Check localStorage directly as fallback
      let tokenFromStorage: string | null = null
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('auth-storage')
          if (stored) {
            const parsed = JSON.parse(stored)
            tokenFromStorage = parsed.state?.token || null
          }
        } catch (e) {
          // Ignore
        }
      }

      const finalToken = currentToken || tokenFromStorage

      // If no token after rehydration, redirect to login with return URL
      if (!finalToken) {
        console.log('[AUTH] No token found after rehydration, redirecting to login')
        // Preserve the intended destination
        const currentPath = window.location.pathname
        
        // Check if we're in a module-specific route
        if (currentPath.startsWith('/crm/')) {
          // Redirect to CRM-specific login
          router.push('/crm/login')
        } else if (currentPath.startsWith('/finance/')) {
          // Redirect to Finance-specific login (future)
          router.push('/login?redirect=' + encodeURIComponent(currentPath))
        } else if (currentPath.startsWith('/sales/')) {
          // Redirect to Sales-specific login (future)
          router.push('/login?redirect=' + encodeURIComponent(currentPath))
        } else {
          // Default: main login with redirect
          const returnUrl = currentPath !== '/login' ? currentPath : '/home'
          router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
        }
        return
      }

      // If token exists but not in state, restore it
      if (tokenFromStorage && !currentToken) {
        useAuthStore.setState({ 
          token: tokenFromStorage,
          isAuthenticated: true, // Assume authenticated if we have a persisted token
          isLoading: false
        })
        return
      }

      // If we have a token but not authenticated, try to fetch user
      if (finalToken && !currentState.isAuthenticated && !currentState.isLoading) {
        console.log('[AUTH] Token found but not authenticated, fetching user...')
        fetchUser().catch((error) => {
          console.error('[AUTH] Auth check failed:', error)
          // Only redirect if token is actually invalid (401)
          // Network errors shouldn't log out the user
          if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
            router.push('/login')
          }
        })
      }
    }, 200) // Small delay to ensure rehydration is complete

    return () => clearTimeout(timeoutId)
  }, [mounted, rehydrated, isAuthenticated, isLoading, token, router, fetchUser])

  // Add a timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentState = useAuthStore.getState()
      if (currentState.isLoading) {
        console.warn('Auth loading timeout - forcing isLoading to false')
        // If we have a token, assume we're authenticated to prevent blocking
        if (currentState.token) {
          useAuthStore.setState({ 
            isLoading: false,
            isAuthenticated: true, // Assume authenticated if we have a token
          })
        } else {
          useAuthStore.setState({ isLoading: false })
        }
      }
    }, 3000) // 3 second timeout (reduced from 5)

    return () => clearTimeout(timeout)
  }, [isLoading])

  // Show loading while mounting, rehydrating, or loading auth state
  if (!mounted || !rehydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // After rehydration, check current state
  const currentState = useAuthStore.getState()
  const currentToken = currentState.token
  const currentIsAuthenticated = currentState.isAuthenticated

  // After loading, if not authenticated and no token, don't render (will redirect)
  if (!currentIsAuthenticated && !currentToken) {
    return null
  }

  // If we have a token but not authenticated yet, show loading (fetchUser is in progress)
  if (currentToken && !currentIsAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" style={{ position: 'relative', zIndex: 1 }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
