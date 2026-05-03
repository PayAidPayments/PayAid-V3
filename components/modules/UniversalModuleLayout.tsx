'use client'

import { ReactNode } from 'react'
import { AppShell } from './AppShell'

interface TopBarItem {
  name: string
  href: string
  icon?: string
}

interface UniversalModuleLayoutProps {
  moduleId: string
  moduleName: string
  topBarItems: TopBarItem[]
  children: ReactNode
  sidebarWidth?: number
  /** Optional left sidebar (260px). */
  sidebar?: ReactNode
}

/**
 * Universal Module Layout: uses AppShell for unified top nav, optional sidebar, main content, and PageAIAssistant.
 * Same structure across all modules (slate theme, full-width layout, 5-band dashboard pattern in pages).
 */
export function UniversalModuleLayout({
  moduleId,
  moduleName,
  topBarItems,
  children,
  sidebar,
}: UniversalModuleLayoutProps) {
  return (
    <AppShell
      moduleId={moduleId}
      moduleName={moduleName}
      topBarItems={topBarItems}
      sidebar={sidebar}
    >
      {children}
    </AppShell>
  )
}
