'use client'

import dynamic from 'next/dynamic'
import { usePathname } from 'next/navigation'

const Providers = dynamic(() => import('./providers').then((m) => m.Providers), {
  // This keeps the heavy provider graph out of the initial "/" compile.
  ssr: false,
})

function useMinimalShell(): boolean {
  const pathname = usePathname()
  // On first client render pathname can be temporarily unavailable.
  // Default to full provider shell to avoid rendering react-query hooks
  // before QueryClientProvider is mounted.
  if (!pathname) return false
  const path = pathname.split('?')[0].replace(/\/+$/, '') || '/'
  if (path === '/') return true
  if (path === '/login' || path === '/signup' || path === '/register') return true
  if (/^\/(crm|sales|finance)\/login$/.test(path)) return true
  return false
}

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const minimal = useMinimalShell()
  if (minimal) return children

  return <Providers>{children}</Providers>
}

