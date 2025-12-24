'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const { isAuthenticated, isLoading, token, fetchUser } = useAuthStore()

  useEffect(() => {
    // Wait for initial load to complete
    if (isLoading) return

    // If no token, redirect to login
    if (!token) {
      router.push('/login')
      return
    }

    // If we have a token but not authenticated, try to fetch user
    if (token && !isAuthenticated) {
      fetchUser().catch((error) => {
        console.error('Auth check failed:', error)
        // Only redirect if token is actually invalid (401)
        // Network errors shouldn't log out the user
      })
    }
  }, [isAuthenticated, isLoading, token, router, fetchUser])

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
