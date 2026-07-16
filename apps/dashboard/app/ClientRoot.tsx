'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const Providers = dynamic(() => import('./providers').then((m) => m.Providers), {
  // This keeps the heavy provider graph out of the initial "/" compile.
  ssr: false,
})

/** Routes that skip the provider graph entirely (marketing/auth shells only). */
function useSkipProviders(): boolean {
  const pathname = usePathname()
  // On first client render pathname can be temporarily unavailable.
  // Default to mounting Providers so /home/* never renders without ThemeProvider.
  if (!pathname) return false
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/') return true
  if (path === '/login' || path === '/signup' || path === '/register') return true
  if (/^\/(crm|sales|finance)\/login$/.test(path)) return true
  return false
}

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const skipProviders = useSkipProviders()
  if (skipProviders) return children

  return <Providers>{children}</Providers>
}
