'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ThemeProvider } from '@/lib/contexts/theme-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const ModuleShell = dynamic(
  () => import('./ModuleShell').then((m) => ({ default: m.ModuleShell })),
  { ssr: true }
)

/** Routes that do not need ModuleProvider (avoids pulling `moduleRegistry` into the same compile graph as auth pages). */
function useMinimalProviderShell(): boolean {
  const pathname = usePathname() ?? ''
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/') return true
  if (path === '/login' || path === '/signup' || path === '/register') return true
  if (/^\/(crm|sales|finance)\/login$/.test(path)) return true
  return false
}

export function Providers({ children }: { children: React.ReactNode }) {
  const minimalShell = useMinimalProviderShell()

  useEffect(() => {
    if (minimalShell && typeof window !== 'undefined') {
      void import('./ModuleShell')
    }
  }, [minimalShell])

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
            gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache (formerly cacheTime)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // Don't refetch on component mount if data is fresh
            retry: 1, // Only retry once on failure
            retryDelay: 1000, // Wait 1 second before retry
            networkMode: 'online', // Only retry when online
          },
        },
      })
  )

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {minimalShell ? (
            children
          ) : (
            <ModuleShell>{children}</ModuleShell>
          )}
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

