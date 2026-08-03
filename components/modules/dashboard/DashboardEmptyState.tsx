'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

type DashboardEmptyStateProps = {
  icon?: ReactNode
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function DashboardEmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: DashboardEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12',
        className
      )}
    >
      {icon ? (
        <div className="mb-4 text-slate-300 dark:text-slate-600 [&_svg]:w-12 [&_svg]:h-12">{icon}</div>
      ) : null}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex items-center rounded-lg bg-[#53328A] px-3 py-2 text-sm font-medium text-white hover:bg-[#452870]"
        >
          {actionLabel}
        </Link>
      ) : null}
      {actionLabel && onAction && !actionHref ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-lg bg-[#53328A] px-3 py-2 text-sm font-medium text-white hover:bg-[#452870]"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
