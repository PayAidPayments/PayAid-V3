'use client'

import { cn } from '@/lib/utils/cn'

export interface StatCardProps {
  title: string
  subtitle?: string
  value: React.ReactNode
  trend?: React.ReactNode
  status?: string
  icon?: React.ReactNode
  className?: string
  /** Fixed height: 'sm' (h-28) or 'md' (h-36). Default sm. */
  height?: 'sm' | 'md'
}

/**
 * Unified stat/KPI card for all PayAid V3 module dashboards.
 * Use this for Band 0 (top stat bar) and Band 2 (KPI grid). Do not create bespoke stat cards.
 */
export function StatCard({
  title,
  subtitle,
  value,
  trend,
  status,
  icon,
  className,
  height = 'sm',
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-5 py-4 flex flex-col justify-between overflow-hidden',
        'hover:shadow-md hover:-translate-y-[1px] transition-all duration-200',
        height === 'sm' && 'h-28',
        height === 'md' && 'h-36',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {title}
        </p>
        {icon && <span className="text-slate-400 dark:text-slate-500 [&_svg]:w-4 [&_svg]:h-4">{icon}</span>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="min-w-0">
          <div className="text-2xl font-semibold text-slate-900 dark:text-slate-50 truncate">
            {value}
          </div>
          {subtitle != null && subtitle !== '' && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        {trend != null && (
          <span className="text-xs flex-shrink-0 text-slate-600 dark:text-slate-300">{trend}</span>
        )}
      </div>
      {status != null && status !== '' && (
        <span className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {status}
        </span>
      )}
    </div>
  )
}
