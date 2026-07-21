'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'

export type BriefingItem = {
  text: string
  href?: string
}

interface TodayAISummaryProps {
  bullets: string[] | BriefingItem[]
  tenantId: string
  loading?: boolean
}

function normalizeItems(bullets: string[] | BriefingItem[]): BriefingItem[] {
  return bullets.map((b) => (typeof b === 'string' ? { text: b } : b))
}

export function TodayAISummary({ bullets, tenantId, loading }: TodayAISummaryProps) {
  const params = useParams()
  const tid = (params?.tenantId as string) || tenantId
  const items = normalizeItems(bullets)

  return (
    <section className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/80 dark:border-slate-700 p-5">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        AI Briefing for today
      </h2>
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-gray-400">Loading…</p>
      ) : items.length > 0 ? (
        <ul className="text-sm text-slate-600 dark:text-gray-300 space-y-2 mb-4">
          {items.slice(0, 4).map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
                >
                  {item.text}
                </Link>
              ) : (
                <span>{item.text}</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          No summary yet. Add deals, invoices, or tasks in CRM, Finance, or Projects to see your daily briefing here.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href={`/crm/${tid}/Tasks`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          View tasks
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href={`/ai-studio/${tid}/Cofounder`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
        >
          Ask AI more
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  )
}
