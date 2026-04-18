'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

export function AutomationPlaceholderPage(props: {
  title: string
  description: string
}) {
  const params = useParams()
  const tenantId = params?.tenantId as string

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-4">
        <nav>
          <Link
            href={`/crm/${tenantId}/Automation`}
            className="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
          >
            ← CRM automation
          </Link>
        </nav>
        <header className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">{props.title}</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {props.description}
          </p>
        </header>
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Configuration UI is being brought online. Inbound capture already flows through the shared orchestration
          pipeline in code; tenant rules, simulation, and live execution logs will appear here next.
        </div>
      </div>
    </div>
  )
}
