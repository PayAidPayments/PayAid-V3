'use client'

import { cn } from '@/lib/utils/cn'

export interface ChartCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

/** Wrapper for dashboard charts. Same title, subtitle, padding across modules. */
export function ChartCard({ title, subtitle, children, className }: ChartCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden',
        'hover:shadow-md hover:-translate-y-[1px] transition-all duration-200',
        className
      )}
    >
      <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</p>
        {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}
