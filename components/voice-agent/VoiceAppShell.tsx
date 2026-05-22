'use client'

import { ReactNode } from 'react'
import { VoiceTopBar, type VoiceTopBarItem } from '@/components/voice-agent/VoiceTopBar'

export type { VoiceTopBarItem }

export type VoiceAppShellProps = {
  moduleName: string
  topBarItems: VoiceTopBarItem[]
  children: ReactNode
  sidebar?: ReactNode
}

/**
 * Voice-only shell: compact top bar, no PageAIAssistant / AppShell shared imports.
 */
export function VoiceAppShell({ moduleName, topBarItems, children, sidebar }: VoiceAppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <VoiceTopBar moduleName={moduleName} items={topBarItems} />
      <main className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 flex gap-4">
        {sidebar != null && (
          <aside className="w-[260px] flex-shrink-0 hidden lg:block">{sidebar}</aside>
        )}
        <section className="flex-1 space-y-4 min-w-0">{children}</section>
      </main>
    </div>
  )
}
