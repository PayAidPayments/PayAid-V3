'use client'

import { Providers } from './providers'

export function ClientRoot({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>
}
