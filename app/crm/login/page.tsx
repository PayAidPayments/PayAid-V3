'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import { Users } from 'lucide-react'

/**
 * CRM Module Login Page
 * Module-specific login with CRM branding
 * After login, redirects to CRM dashboard: /crm/[tenantId]/Home/
 */
export default function CRMLoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  
  // Safely access auth store after component mounts
  const { login, isLoading, isAuthenticated, tenant } = useAuthStore()
  
  useEffect(() => {
    setMounted(true)
    
    // If already logged in, redirect to CRM dashboard
    if (isAuthenticated && tenant?.id) {
      router.push(`/crm/${tenant.id}/Home/`)
    }
  }, [isAuthenticated, tenant?.id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      
      // Get tenant ID from auth store after login completes
      const { tenant } = useAuthStore.getState()
      
      // Always redirect to CRM dashboard after login
      if (tenant?.id) {
        router.push(`/crm/${tenant.id}/Home/`)
      } else {
        // No tenant - redirect to main dashboard
        router.push('/dashboard')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }
  
  // Prevent hydration issues
  if (!mounted) {
    return null
  }

  // If already authenticated, show loading while redirecting
  if (isAuthenticated && tenant?.id) {
    return <PageLoading message="Redirecting to CRM..." fullScreen={true} />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Users className="w-8 h-8 text-white" />
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <Link 
              href="/home" 
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Apps
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Sign in to CRM
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your CRM dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in to CRM'}
            </Button>

            <div className="text-center text-sm text-gray-600">
              <Link href="/login" className="hover:text-gray-900 underline">
                Use main login page instead
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


