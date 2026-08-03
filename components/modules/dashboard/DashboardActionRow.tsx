'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { DashboardAction } from './types'

export function DashboardActionRow({ actions }: { actions: DashboardAction[] }) {
  const items = actions.slice(0, 4)
  if (!items.length) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
        Actions
      </span>
      {items.map((action) => {
        const className = cn(
          'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          action.variant === 'secondary'
            ? 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900'
            : 'bg-[#53328A] text-white hover:bg-[#452870]'
        )

        if (action.href) {
          return (
            <Link key={action.label} href={action.href} className={className}>
              {action.icon}
              {action.label}
            </Link>
          )
        }

        return (
          <button key={action.label} type="button" onClick={action.onClick} className={className}>
            {action.icon}
            {action.label}
          </button>
        )
      })}
    </div>
  )
}
