'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/brand/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  
  // Safely access auth store after component mounts
  const { login, isLoading } = useAuthStore()
  
  useEffect(() => {
    // Set mounted immediately - no blocking operations
    setMounted(true)
    
    // Get redirect URL from query params (non-blocking)
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search)
        const redirect = params.get('redirect')
        if (redirect) {
          setRedirectUrl(redirect)
        }
      } catch (error) {
        console.warn('Failed to parse redirect URL:', error)
      }
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      await login(email, password)
      
      // Get tenant ID from auth store after login completes
      const { tenant } = useAuthStore.getState()
      
      // Redirect to intended URL if provided, otherwise to dashboard
      if (redirectUrl) {
        let finalUrl = redirectUrl
        
        // Handle module routing - always redirect to module home/dashboard
        if (redirectUrl === '/crm' || redirectUrl.startsWith('/crm')) {
          if (tenant?.id) {
            // Redirect to CRM dashboard: /crm/[tenantId]/Home/
            finalUrl = `/crm/${tenant.id}/Home/`
          } else {
            // No tenant - go to home page
            finalUrl = '/home'
          }
        } else if (redirectUrl === '/sales' || redirectUrl.startsWith('/sales')) {
          if (tenant?.id) {
            // Redirect to Sales dashboard: /sales/[tenantId]/Home/
            finalUrl = `/sales/${tenant.id}/Home/`
          } else {
            finalUrl = '/home'
          }
        } else if (redirectUrl === '/finance' || redirectUrl.startsWith('/finance')) {
          if (tenant?.id) {
            // Redirect to Finance dashboard: /finance/[tenantId]/Home/
            finalUrl = `/finance/${tenant.id}/Home/`
          } else {
            finalUrl = '/home'
          }
        } else if (redirectUrl === '/projects' || redirectUrl.startsWith('/projects')) {
          if (tenant?.id) {
            // Redirect to Projects dashboard: /projects/[tenantId]/Home/
            finalUrl = `/projects/${tenant.id}/Home/`
          } else {
            finalUrl = '/home'
          }
        } else if (redirectUrl === '/inventory' || redirectUrl.startsWith('/inventory')) {
          if (tenant?.id) {
            // Redirect to Inventory dashboard: /inventory/[tenantId]/Home/
            finalUrl = `/inventory/${tenant.id}/Home/`
          } else {
            finalUrl = '/home'
          }
        } else if (redirectUrl === '/marketing' || redirectUrl.startsWith('/marketing')) {
          if (tenant?.id) {
            // Redirect to Marketing dashboard: /marketing/[tenantId]/Home/
            finalUrl = `/marketing/${tenant.id}/Home/`
          } else {
            finalUrl = '/home'
          }
        } else if (redirectUrl === '/hr' || redirectUrl.startsWith('/hr')) {
          if (tenant?.id) {
            // Redirect to HR dashboard: /hr/[tenantId]/Home/
            finalUrl = `/hr/${tenant.id}/Home/`
          } else {
            finalUrl = '/home'
          }
        } else if (redirectUrl.startsWith('/dashboard/')) {
          // For dashboard routes, check if it's a module-specific feature page
          // If so, redirect to module home instead
          if (redirectUrl.includes('/dashboard/landing-pages') || redirectUrl.includes('/dashboard/checkout-pages')) {
            // Sales module feature - redirect to Sales home
            if (tenant?.id) {
              finalUrl = `/sales/${tenant.id}/Home/`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/invoices')) {
            // Finance module feature - redirect to Finance Invoices
            if (tenant?.id) {
              finalUrl = `/finance/${tenant.id}/Invoices`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/accounting')) {
            // Finance module feature - redirect to Finance Accounting
            if (tenant?.id) {
              finalUrl = `/finance/${tenant.id}/Accounting`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/purchases') || redirectUrl.includes('/dashboard/purchases/orders')) {
            // Finance module feature - redirect to Finance Purchase Orders
            if (tenant?.id) {
              finalUrl = `/finance/${tenant.id}/Purchase-Orders`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/gst')) {
            // Finance module feature - redirect to Finance GST
            if (tenant?.id) {
              finalUrl = `/finance/${tenant.id}/GST`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/marketing')) {
            // Marketing module feature - redirect to Marketing home
            if (tenant?.id) {
              finalUrl = `/marketing/${tenant.id}/Home/`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/hr')) {
            // HR module feature - redirect to HR home
            if (tenant?.id) {
              finalUrl = `/hr/${tenant.id}/Home/`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/contacts') || redirectUrl.includes('/dashboard/deals') || redirectUrl.includes('/dashboard/tasks')) {
            // CRM module feature - redirect to CRM home
            if (tenant?.id) {
              finalUrl = `/crm/${tenant.id}/Home/`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/orders')) {
            // Orders are part of Sales module - redirect to Sales Orders
            if (tenant?.id) {
              finalUrl = `/sales/${tenant.id}/Orders`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/projects') || redirectUrl.includes('/dashboard/gantt')) {
            // Projects module feature - redirect to Projects home
            if (tenant?.id) {
              finalUrl = `/projects/${tenant.id}/Home/`
            } else {
              finalUrl = '/home'
            }
          } else if (redirectUrl.includes('/dashboard/products') || redirectUrl.includes('/dashboard/inventory')) {
            // Inventory module feature - redirect to Inventory home
            if (tenant?.id) {
              finalUrl = `/inventory/${tenant.id}/Home/`
            } else {
              finalUrl = '/home'
            }
          } else if (tenant?.id && !redirectUrl.includes(`/dashboard/${tenant.id}`)) {
            // Add tenant ID to dashboard path if not present
            const pathWithoutDashboard = redirectUrl.replace(/^\/dashboard\/?/, '')
            finalUrl = `/dashboard/${tenant.id}${pathWithoutDashboard ? '/' + pathWithoutDashboard : ''}`
          }
        } else if (tenant?.id && !redirectUrl.includes(`/dashboard/${tenant.id}`)) {
          // Add tenant ID to dashboard path if not present
          const pathWithoutDashboard = redirectUrl.replace(/^\/dashboard\/?/, '')
          finalUrl = `/dashboard/${tenant.id}${pathWithoutDashboard ? '/' + pathWithoutDashboard : ''}`
        }
        
        router.push(finalUrl)
      } else {
        // Default: Always redirect to /home to show all apps
        router.push('/home')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }
  
  // Show loading state immediately instead of null
  if (!mounted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="space-y-3 mt-6">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="absolute top-4 left-4">
        <Logo href="/" />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <Link 
              href="/" 
              className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Home
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            Sign in to PayAid V3
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                <div className="font-medium mb-1">Login Failed</div>
                <div>{error}</div>
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 text-xs text-red-500">
                    Check the browser console (F12) for more details.
                  </div>
                )}
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
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0A9.97 9.97 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <div className="text-center text-sm">
              <span className="text-gray-600">Don&apos;t have an account? </span>
              <Link href="/register" className="text-blue-600 hover:underline">
                Sign up
              </Link>
            </div>
            <div className="text-center">
              <Link 
                href="/" 
                className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Return to Home Page
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
