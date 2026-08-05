'use client'

import { P3ProjectRequestsPanel } from '@/components/projects/P3ProjectRequestsPanel'

export default function ProjectRequestsPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <header>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-gray-100">
            Project requests
          </h1>
          <p className="text-sm text-slate-500 dark:text-gray-400 mt-1">
            P3 delivery thin operator surface — planning → active → completed|cancelled. No full PM rebuild.
          </p>
        </header>
        <P3ProjectRequestsPanel />
      </div>
    </div>
  )
}
