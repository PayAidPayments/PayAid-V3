'use client'

import { cn } from '@/lib/utils/cn'

export type FinanceCardAccent = 'yellow' | 'green' | 'blue' | 'purple' | 'red'

export interface FinanceCardProps {
  title: string
  subtitle?: string
  /** Optional status pill: "On Track" (green) or "At Risk" (red) */
  statusPill?: 'On Track' | 'At Risk'
  children?: React.ReactNode
  accent?: FinanceCardAccent
  className?: string
}

const accentMapLight: Record<FinanceCardAccent, string> = {
  yellow: 'border-amber-200 dark:border-amber-500/40',
  green: 'border-emerald-200 dark:border-emerald-500/40',
  blue: 'border-sky-200 dark:border-sky-500/40',
  purple: 'border-violet-200 dark:border-violet-500/40',
  red: 'border-rose-200 dark:border-rose-500/40',
}


export function FinanceCard({
  title,
  subtitle,
  statusPill,
  children,
  accent = 'blue',
  className = '',
}: FinanceCardProps) {
  return (
    <div
      className={cn(
        'h-full rounded-2xl border shadow-lg px-5 py-4 flex flex-col justify-between overflow-hidden',
        'bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-50',
        accentMapLight[accent],
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          {subtitle !== undefined && subtitle !== '' && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate line-clamp-2">{subtitle}</p>
          )}
        </div>
        {statusPill && (
          <span
            className={cn(
              'flex-shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full',
              statusPill === 'On Track'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
            )}
          >
            {statusPill}
          </span>
        )}
      </div>
      <div className="flex-1 flex flex-col justify-between gap-2 min-w-0">
        {children}
      </div>
    </div>
  )
}
