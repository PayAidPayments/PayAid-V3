'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export function CampaignStatusHealthBanner({ warnings }: { warnings: string[] }) {
  if (!warnings.length) return null
  return (
    <div
      data-testid="campaign-status-warning"
      className={cn(
        'rounded-xl border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950',
        'dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-100'
      )}
      role="status"
    >
      <div className="flex gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden />
        <ul className="list-disc pl-1 space-y-1">
          {warnings.map((w, i) => (
            <li key={i}>{w}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
