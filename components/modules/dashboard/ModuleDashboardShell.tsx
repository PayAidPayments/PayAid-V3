'use client'

import type { ReactNode } from 'react'
import { Building2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { getModuleConfig } from '@/lib/modules/module-config'
import { cn } from '@/lib/utils/cn'
import { DashboardKpiRow } from './DashboardKpiCard'
import { DashboardInsightStrip } from './DashboardInsightStrip'
import { DashboardActionRow } from './DashboardActionRow'
import { DashboardSection } from './DashboardSection'
import type { DashboardAction, DashboardInsight, DashboardKpi } from './types'

export type ModuleDashboardShellProps = {
  moduleId: string
  /** Overrides config name when needed (e.g. "HR & Payroll"). */
  title?: string
  subtitle?: string
  moduleIcon?: ReactNode
  /** Optional controls in the header (period select, view switcher). */
  headerExtra?: ReactNode
  kpis: DashboardKpi[]
  insight?: DashboardInsight
  actions?: DashboardAction[]
  /** Exactly one secondary band: chart | queue | recent. */
  secondary?: ReactNode
  secondaryTitle?: string
  secondaryDescription?: string
  secondaryActions?: ReactNode
  children?: ReactNode
  className?: string
  error?: string | null
}

/**
 * Uniform 5-band module home:
 * Header → KPI row (max 4) → Insight → Actions → Secondary band
 */
export function ModuleDashboardShell({
  moduleId,
  title,
  subtitle,
  moduleIcon,
  headerExtra,
  kpis,
  insight,
  actions,
  secondary,
  secondaryTitle,
  secondaryDescription,
  secondaryActions,
  children,
  className,
  error,
}: ModuleDashboardShellProps) {
  const { tenant, user } = useAuthStore()
  const config = getModuleConfig(moduleId)
  const Icon = config?.icon
  const displayTitle = title || config?.name || moduleId
  const displaySubtitle =
    subtitle || config?.description || tenant?.name || 'Your Business'

  return (
    <div className={cn('w-full min-h-screen bg-slate-50 dark:bg-slate-950', className)}>
      {/* Band 1: Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 py-5">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2.5">
              {moduleIcon ? (
                <span className="text-[#53328A] dark:text-purple-300">{moduleIcon}</span>
              ) : Icon ? (
                <Icon className="w-7 h-7 text-[#53328A] dark:text-purple-300" />
              ) : null}
              <span>{displayTitle}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              {displaySubtitle}
              {user?.name ? (
                <span className="hidden sm:inline text-slate-400">· Welcome back, {user.name}</span>
              ) : null}
            </p>
          </div>
          {headerExtra ? <div className="flex flex-wrap items-center gap-2">{headerExtra}</div> : null}
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-6 space-y-5">
        {error ? (
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Error</p>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : null}

        {/* Band 2: KPIs */}
        <DashboardKpiRow kpis={kpis} />

        {/* Band 3: Insight */}
        {insight ? <DashboardInsightStrip insight={insight} /> : null}

        {/* Band 4: Actions */}
        {actions?.length ? <DashboardActionRow actions={actions} /> : null}

        {/* Band 5: Secondary */}
        {secondary ? (
          <DashboardSection
            title={secondaryTitle}
            description={secondaryDescription}
            actions={secondaryActions}
          >
            {secondary}
          </DashboardSection>
        ) : null}

        {children}
      </div>
    </div>
  )
}
