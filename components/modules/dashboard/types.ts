import type { ReactNode } from 'react'

export type DashboardKpiTone = 'purple' | 'gold' | 'success' | 'info' | 'warning' | 'error'

export type DashboardKpi = {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  icon?: ReactNode
  tone?: DashboardKpiTone
  href?: string
  onClick?: () => void
  /** Optional sparkline points (0–100 normalized or raw). */
  sparkline?: number[]
  /** When true, shows an empty reserved slot instead of a live metric. */
  empty?: boolean
  emptyLabel?: string
}

export type DashboardAction = {
  label: string
  href?: string
  onClick?: () => void
  icon?: ReactNode
  variant?: 'primary' | 'secondary'
}

export type DashboardInsight = {
  title?: string
  text: string
  status?: 'ready' | 'loading' | 'unavailable'
  onRefresh?: () => void
  href?: string
  hrefLabel?: string
}
