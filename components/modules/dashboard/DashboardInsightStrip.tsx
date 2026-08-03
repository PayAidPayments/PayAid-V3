'use client'

import Link from 'next/link'
import { RefreshCw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { DashboardInsight } from './types'

export function DashboardInsightStrip({ insight }: { insight: DashboardInsight }) {
  const status = insight.status || 'ready'

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200/80 dark:border-slate-800',
        'bg-white dark:bg-slate-950 px-4 py-3 shadow-sm',
        'flex flex-col sm:flex-row sm:items-center gap-3'
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="mt-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 p-2 shrink-0">
          <Sparkles className="w-4 h-4 text-[#53328A] dark:text-purple-300" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {insight.title || 'AI summary'}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-200 mt-0.5 leading-relaxed">
            {status === 'loading'
              ? 'Generating insight…'
              : status === 'unavailable'
                ? insight.text || 'Insights unavailable'
                : insight.text}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {insight.href ? (
          <Link
            href={insight.href}
            className="text-sm font-medium text-[#53328A] dark:text-purple-300 hover:underline"
          >
            {insight.hrefLabel || 'View details'}
          </Link>
        ) : null}
        {insight.onRefresh ? (
          <button
            type="button"
            onClick={insight.onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900"
            disabled={status === 'loading'}
          >
            <RefreshCw className={cn('w-3.5 h-3.5', status === 'loading' && 'animate-spin')} />
            Refresh
          </button>
        ) : null}
      </div>
    </div>
  )
}
