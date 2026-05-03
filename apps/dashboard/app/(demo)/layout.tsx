'use client'

import Link from 'next/link'

/**
 * Minimal layout for /demo/* routes.
 * No AppShell or module switcher – only the demo content loads for a faster, focused demo.
 */
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Marketing Demo
          </span>
          <Link
            href="/home"
            className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Open full app →
          </Link>
        </div>
      </header>
      {children}
    </div>
  )
}
