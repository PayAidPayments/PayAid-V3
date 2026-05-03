'use client'

import { ModuleProvider } from '@/contexts/ModuleContext'

/** Lazy-loaded wrapper so `/login` and other public routes avoid compiling the full module registry. */
export function ModuleShell({ children }: { children: React.ReactNode }) {
  return <ModuleProvider>{children}</ModuleProvider>
}
