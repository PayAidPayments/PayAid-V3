'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Sparkles, ArrowRight } from 'lucide-react'

interface TodayAISummaryProps {
  bullets: string[]
  tenantId: string
  loading?: boolean
}

export function TodayAISummary({ bullets, tenantId, loading }: TodayAISummaryProps) {
  const params = useParams()
  const tid = (params?.tenantId as string) || tenantId

  return (
    <section className="rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-900/80 border border-slate-200/80 dark:border-slate-700 p-5">
      <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-indigo-500" />
        AI Briefing for today
      </h2>
      {loading ? (
        <p className="text-sm text-slate-500 dark:text-gray-400">Loading…</p>
      ) : bullets.length > 0 ? (
        <ul className="text-sm text-slate-600 dark:text-gray-300 space-y-1.5 list-disc list-inside mb-4">
          {bullets.slice(0, 4).map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-4">
          No summary yet. Open modules to see insights here.
        </p>
      )}
      <Link
        href={`/ai-cofounder/${tid}/Home`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
      >
        Ask AI more
        <ArrowRight className="w-4 h-4" />
      </Link>
    </section>
  )
}
