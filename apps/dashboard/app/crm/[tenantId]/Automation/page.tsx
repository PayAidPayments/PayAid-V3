'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  GitBranch,
  LayoutList,
  ListOrdered,
  Route,
  Sparkles,
} from 'lucide-react'

const sections: Array<{
  title: string
  description: string
  href: string
  icon: typeof Route
}> = [
  {
    title: 'Lead routing',
    description: 'Territory, source, score, round-robin, and fallback queues for inbound leads.',
    href: 'Lead-Routing',
    icon: Route,
  },
  {
    title: 'Follow-up playbooks',
    description: 'First response, SLAs, escalations, and stop rules after capture.',
    href: 'Follow-up-Playbooks',
    icon: BookOpen,
  },
  {
    title: 'Forms',
    description: 'Form objectives, source tagging, assignment, acknowledgments, and nurture hooks.',
    href: 'Forms',
    icon: LayoutList,
  },
  {
    title: 'Sequences',
    description: 'Multi-step nurture and sales sequences tied to orchestration outcomes.',
    href: 'Sequences',
    icon: ListOrdered,
  },
  {
    title: 'Queues and SLAs',
    description: 'Inbound queues, working hours, SLA timers, and reassignment.',
    href: 'Queues-and-SLAs',
    icon: ClipboardList,
  },
  {
    title: 'Execution logs',
    description: 'Dedupe, scoring, routing decisions, workflows, and delivery status per lead.',
    href: 'Execution-Logs',
    icon: GitBranch,
  },
]

export default function CrmAutomationHubPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const base = `/crm/${tenantId}/Automation`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">CRM automation</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            One place to configure how inbound leads are normalized, assigned, followed up, and audited across
            forms, chat, social, imports, and manual CRM entry. Workflow builder lives under Sales automation.
          </p>
        </header>

        <Link
          href={`/crm/${tenantId}/SalesAutomation`}
          className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm transition hover:shadow-md hover:-translate-y-[1px] dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-200">
              <Sparkles className="h-4 w-4" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">Sales automation (workflows)</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Event-based workflows that run after orchestration fires standard CRM events.
              </p>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        </Link>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sections.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={`${base}/${href}`}
              className="group flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:-translate-y-[1px] dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" aria-hidden />
                <h2 className="text-sm font-semibold">{title}</h2>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{description}</p>
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300 group-hover:underline">
                Open
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
