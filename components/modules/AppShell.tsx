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
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 flex gap-4">
        {sidebar != null && (
          <aside className="w-[260px] flex-shrink-0 hidden lg:block">
            {sidebar}
          </aside>
        )}
        <section className="flex-1 space-y-4 min-w-0">
          {children}
        </section>
        <PageAIAssistant />
      </main>
    </div>
  )
}
