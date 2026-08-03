'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

type DashboardSectionProps = {
  title?: string
  description?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardSection({
  title,
  description,
  actions,
  children,
  className,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-200/80 dark:border-slate-800',
        'bg-white dark:bg-slate-950 shadow-sm p-5',
        className
      )}
    >
      {(title || actions) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      {children}
    </section>
  )
}
