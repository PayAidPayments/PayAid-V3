'use client'

import { ReactNode } from 'react'
import { ModuleTopBar } from './ModuleTopBar'
import { PageAIAssistant } from '@/components/ai/PageAIAssistant'

export interface TopBarItem {
  name: string
  href: string
  icon?: string
}

export interface AppShellProps {
  moduleId: string
  moduleName: string
  topBarItems: TopBarItem[]
  children: ReactNode
  /** Optional left sidebar (same width & style across modules). */
  sidebar?: ReactNode
}

/**
 * Unified app shell for all PayAid V3 module pages.
 * Same top nav (ModuleTopBar), optional sidebar, main content, and page-scoped AI assistant.
 */
export function AppShell({
  moduleId,
  moduleName,
  topBarItems,
  children,
  sidebar,
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <ModuleTopBar
        moduleId={moduleId}
        moduleName={moduleName}
        items={topBarItems}
      />
      <main className="max-w-7xl mx-auto w-full px-4 py-5 flex gap-5">
        {sidebar != null && (
          <aside className="w-[260px] flex-shrink-0 hidden lg:block">
            {sidebar}
          </aside>
        )}
        <section className="flex-1 space-y-5 min-w-0">
          {children}
        </section>
        <PageAIAssistant />
      </main>
    </div>
  )
}
