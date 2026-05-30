'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/brand/Logo'

function safeRedirectPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null
  return raw
}

export default function VoiceLoginPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  const { login, isLoading } = useAuthStore()

  useEffect(() => {
    const id = globalThis.setTimeout(() => {
      setMounted(true)
      if (typeof window === 'undefined') return
      try {
        const params = new URLSearchParams(window.location.search)
        setRedirectUrl(safeRedirectPath(params.get('redirect')))
      } catch {
        // ignore
      }
    }, 0)
    return () => globalThis.clearTimeout(id)
  }, [])

  const clearAuthStorage = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem('auth-storage')
      localStorage.removeItem('token')
      localStorage.removeItem('auth-token')
      localStorage.removeItem('payaid_sso_token')
      sessionStorage.removeItem('payaid_sso_token')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('auth-token')
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
      useAuthStore.getState().logout()
    } catch {
      // ignore
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    clearAuthStorage()
    try {
      const loginResult = await login(email, password)
      const tenant = loginResult.tenant
      if (!tenant?.id) {
        setError('This account has no workspace tenant. Use your main PayAid login or contact support.')
        return
      }

      const afterLogin = redirectUrl ?? `/voice-agents/${tenant.id}/Home/`
      router.push(afterLogin)
    } catch (err) {
      let errorMessage = 'Login failed'
      if (err instanceof Error) {
        errorMessage = err.message
        if (
          errorMessage.includes('timeout') ||
          errorMessage.includes('timed out') ||
          errorMessage.includes('longer than usual')
        ) {
          errorMessage = 'Login is taking longer than usual. Please try again in a moment.'
        } else if (errorMessage.includes('Invalid email or password')) {
          errorMessage = 'Invalid email or password.'
        }
      }
      setError(errorMessage)
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-3/4 mx-auto" />
          <div className="h-10 bg-slate-200 rounded" />
          <div className="h-10 bg-slate-200 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center">
          <Logo href="/" />
        </div>
        <Card className="shadow-lg border-slate-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Sign in to Voice Agents</CardTitle>
            <CardDescription className="text-center">
              Use your PayAid account. After sign-in you will open your voice workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="on">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  <div className="font-medium mb-1">Login failed</div>
                  <div>{error}</div>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900 underline-offset-2 hover:underline">
                Back to Voice Agents home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
