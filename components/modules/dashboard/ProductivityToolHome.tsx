'use client'

import type { ReactNode } from 'react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  type DashboardAction,
  type DashboardKpi,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'

type ProductivityToolHomeProps = {
  moduleId: string
  title?: string
  tenantId: string
  kpis?: DashboardKpi[]
  insightText?: string
  actions: DashboardAction[]
  emptyIcon: ReactNode
  emptyTitle: string
  emptyDescription: string
  emptyActionLabel: string
  emptyActionHref: string
  /** Optional recent items list instead of empty state. */
  recent?: ReactNode
  secondaryTitle?: string
}

/**
 * Uniform home for incomplete productivity tools (Docs, Sheets, Slides, Meet, PDF, Drive).
 */
export function ProductivityToolHome({
  moduleId,
  title,
  tenantId,
  kpis,
  insightText,
  actions,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
  recent,
  secondaryTitle = 'Get started',
}: ProductivityToolHomeProps) {
  const config = getModuleConfig(moduleId) || getModuleConfig('productivity')!

  const defaultKpis: DashboardKpi[] = [
    {
      label: 'Items',
      value: '—',
      empty: true,
      emptyLabel: 'Not tracked yet',
      tone: 'purple',
    },
    {
      label: 'Recent',
      value: '—',
      empty: true,
      emptyLabel: 'No activity',
      tone: 'info',
    },
    {
      label: 'Shared',
      value: '—',
      empty: true,
      emptyLabel: 'Coming soon',
      tone: 'gold',
    },
    {
      label: 'Storage',
      value: '—',
      empty: true,
      emptyLabel: 'Coming soon',
      tone: 'success',
    },
  ]

  return (
    <ModuleDashboardShell
      moduleId={moduleId}
      title={title || config.name}
      moduleIcon={<config.icon className="w-7 h-7" />}
      subtitle={config.description}
      kpis={kpis && kpis.length ? kpis : defaultKpis}
      insight={{
        text:
          insightText ||
          `${config.name} is available as a starter surface. Full editing depth is still rolling out — use the actions below to begin.`,
        status: 'unavailable',
      }}
      actions={actions.slice(0, 4)}
      secondaryTitle={secondaryTitle}
      secondaryDescription="Primary workspace entry for this tool"
      secondary={
        recent || (
          <DashboardEmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            actionHref={emptyActionHref}
          />
        )
      }
    />
  )
}
