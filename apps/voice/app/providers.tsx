'use client'

import dynamic from 'next/dynamic'
import { ThemeProvider } from '@/lib/contexts/theme-context'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const VercelWebVitals = dynamic(
  () =>
    import('@/components/performance/VercelWebVitals').then((m) => ({
      default: m.VercelWebVitals,
    })),
  { ssr: false }
)

/** Voice app providers — no react-query (voice routes use fetch + zustand only). */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>{children}</ThemeProvider>
      <VercelWebVitals />
    </ErrorBoundary>
  )
}
