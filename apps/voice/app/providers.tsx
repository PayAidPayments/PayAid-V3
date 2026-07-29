'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ThemeProvider } from '@/lib/contexts/theme-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useAuthStore } from '@/lib/stores/auth'
import { validateSSOTokenFromQuery } from '@/lib/sso/token-manager'

const VercelWebVitals = dynamic(
  () =>
    import('@/components/performance/VercelWebVitals').then((m) => ({
      default: m.VercelWebVitals,
    })),
  { ssr: false }
)

function applyTokenCookie(token: string) {
  const expires = new Date()
  expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000)
  const isSecure = window.location.protocol === 'https:'
  document.cookie = `token=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
}

/** Hydrate auth from ?sso_token=… on first paint of the voice host. */
function SSOHydration() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    const urlParams = new URLSearchParams(window.location.search)
    const ssoToken = urlParams.get('sso_token')
    const tenantId = urlParams.get('tenant_id')
    const userId = urlParams.get('user_id')

    // Prefer dedicated query handoff; also accept legacy token-manager path.
    const token = ssoToken || validateSSOTokenFromQuery()?.token || null
    if (!token) return

    applyTokenCookie(token)
    useAuthStore.setState({
      token,
      isAuthenticated: true,
    })

    // Persist into zustand storage key used by dashboard/voice auth store.
    try {
      const raw = localStorage.getItem('auth-storage')
      const parsed = raw ? JSON.parse(raw) : { state: {}, version: 0 }
      parsed.state = {
        ...(parsed.state || {}),
        token,
        isAuthenticated: true,
      }
      localStorage.setItem('auth-storage', JSON.stringify(parsed))
    } catch {
      /* ignore storage errors */
    }

    void useAuthStore.getState().fetchUser?.()

    if (ssoToken && tenantId && userId) {
      const cleanUrl = new URL(window.location.href)
      cleanUrl.searchParams.delete('sso_token')
      cleanUrl.searchParams.delete('tenant_id')
      cleanUrl.searchParams.delete('user_id')
      window.history.replaceState({}, '', cleanUrl.toString())
    }
  }, [])

  return null
}

/** Voice app providers — no react-query (voice routes use fetch + zustand only). */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SSOHydration />
        {children}
      </ThemeProvider>
      <VercelWebVitals />
    </ErrorBoundary>
  )
}
