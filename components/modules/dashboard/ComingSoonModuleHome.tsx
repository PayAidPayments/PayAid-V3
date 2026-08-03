'use client'

import type { ReactNode } from 'react'
import { Construction } from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  type DashboardAction,
  type DashboardKpi,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'

export type ComingSoonModuleHomeProps = {
  moduleId: string
  title?: string
  description?: string
  tenantId: string
  /** Optional primary workspace links (max 4). */
  actions?: DashboardAction[]
  emptyTitle?: string
  emptyDescription?: string
  emptyActionLabel?: string
  emptyActionHref?: string
  emptyIcon?: ReactNode
}

/**
 * Uniform home for industry / incomplete modules.
 * Honest empty KPIs — no fake demo numbers.
 */
export function ComingSoonModuleHome({
  moduleId,
  title,
  description,
  tenantId,
  actions,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  emptyActionHref,
  emptyIcon,
}: ComingSoonModuleHomeProps) {
  const config = getModuleConfig(moduleId) || getModuleConfig('home')!
  const displayTitle = title || config.name
  const displayDescription =
    description || config.description || 'Module workspace is reserved on the uniform dashboard shell.'

  const kpis: DashboardKpi[] = [
    { label: 'Primary metric', value: '—', empty: true, emptyLabel: 'Not live yet', tone: 'purple' },
    { label: 'Activity', value: '—', empty: true, emptyLabel: 'Coming soon', tone: 'info' },
    { label: 'Pipeline', value: '—', empty: true, emptyLabel: 'Coming soon', tone: 'gold' },
    { label: 'Health', value: '—', empty: true, emptyLabel: 'Coming soon', tone: 'success' },
  ]

  const defaultActions: DashboardAction[] = [
    {
      label: 'Back to CRM',
      href: `/crm/${tenantId}/Home`,
      variant: 'secondary',
    },
  ]

  return (
    <ModuleDashboardShell
      moduleId={moduleId}
      title={displayTitle}
      moduleIcon={<config.icon className="w-7 h-7" />}
      subtitle={displayDescription}
      kpis={kpis}
      insight={{
        text: `${displayTitle} is on the shared PayAid dashboard layout. Feature depth is still rolling out — this home stays honest with empty KPIs until live data exists.`,
        status: 'unavailable',
      }}
      actions={(actions && actions.length ? actions : defaultActions).slice(0, 4)}
      secondaryTitle="Status"
      secondaryDescription="Honest empty state — no placeholder analytics"
      secondary={
        <DashboardEmptyState
          icon={emptyIcon || <Construction />}
          title={emptyTitle || `${displayTitle} coming soon`}
          description={
            emptyDescription ||
            'This module shell is reserved for future industry workflows. Core platform modules (CRM, Finance, HR, Projects) remain the recommended path today.'
          }
          actionLabel={emptyActionLabel || 'Open CRM'}
          actionHref={emptyActionHref || `/crm/${tenantId}/Home`}
        />
      }
    />
  )
}
