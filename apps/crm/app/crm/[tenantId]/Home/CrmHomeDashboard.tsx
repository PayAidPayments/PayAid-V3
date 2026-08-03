'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import type { ReactNode } from 'react'
import {
  AlertCircle,
  BarChart3,
  Briefcase,
  IndianRupee,
  Plus,
  Users,
} from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { CrmHomeChartsSkeleton } from './CrmHomeCharts'

const CrmHomeCharts = dynamic(
  () => import('./CrmHomeCharts').then((m) => ({ default: m.CrmHomeCharts })),
  { ssr: false, loading: () => <CrmHomeChartsSkeleton /> }
)

export type CrmHomeDashboardStats = {
  dealsCreatedThisMonth: number
  revenueThisMonth: number
  dealsClosingThisMonth: number
  overdueTasks: number
  pipelineByStage: { stage: string; count: number }[]
  monthlyLeadCreation: { month: string; count: number }[]
  topLeadSources: {
    name: string
    leadsCount: number
    conversionsCount: number
    totalValue: number
    conversionRate: number
  }[]
}

type Props = {
  tenantId: string
  userName?: string
  loading: boolean
  error: string | null
  stats: CrmHomeDashboardStats
  timePeriod: 'month' | 'quarter' | 'financial-year' | 'year'
  onTimePeriodChange: (period: 'month' | 'quarter' | 'financial-year' | 'year') => void
  currentView: 'manager' | 'custom' | 'sales' | 'pipeline' | 'activity' | 'tasks'
  onViewChange: (view: string) => void
  tasksToday?: Array<{ id: string; title: string; dueDate?: string }>
  activityItems?: Array<{ id: string; summary?: string; type?: string; createdAt?: string }>
  isDark?: boolean
}

const CHART_COLORS = ['#53328A', '#F5C700', '#059669', '#0284C7', '#D97706', '#8B5CF6']

export function CrmHomeDashboard({
  tenantId,
  loading,
  error,
  stats,
  timePeriod,
  onTimePeriodChange,
  currentView,
  onViewChange,
  tasksToday = [],
  activityItems = [],
  isDark = false,
}: Props) {
  if (loading) return <DashboardSkeleton />

  const pipelineTotal = (stats.pipelineByStage || []).reduce(
    (sum, stage) => sum + (Number(stage.count) || 0),
    0
  )

  const kpis: DashboardKpi[] = [
    {
      label: 'Deals created',
      value: stats.dealsCreatedThisMonth,
      tone: 'purple',
      icon: <Briefcase className="w-5 h-5" />,
      href: `/crm/${tenantId}/Deals?category=created&timePeriod=${timePeriod}`,
    },
    {
      label: 'Revenue',
      value: formatINRForDisplay(stats.revenueThisMonth || 0),
      tone: 'gold',
      icon: <IndianRupee className="w-5 h-5" />,
      href: `/crm/${tenantId}/Deals?category=won&timePeriod=${timePeriod}`,
    },
    {
      label: 'Pipeline size',
      value: pipelineTotal,
      tone: 'info',
      icon: <BarChart3 className="w-5 h-5" />,
      href: `/crm/${tenantId}/Deals`,
    },
    {
      label: 'Overdue tasks',
      value: stats.overdueTasks,
      tone: stats.overdueTasks > 0 ? 'error' : 'success',
      icon: <AlertCircle className="w-5 h-5" />,
      href: `/crm/${tenantId}/Tasks?filter=overdue`,
    },
  ]

  const insightText =
    stats.overdueTasks > 0
      ? `${stats.overdueTasks} overdue task${stats.overdueTasks === 1 ? '' : 's'} need attention. ${pipelineTotal} deals are active in pipeline this period.`
      : pipelineTotal > 0
        ? `Pipeline is healthy with ${pipelineTotal} active deals. Revenue this period: ${formatINRForDisplay(stats.revenueThisMonth || 0)}.`
        : 'No active pipeline yet. Create a deal or import leads to get started.'

  const actions: DashboardAction[] = [
    {
      label: 'New deal',
      href: `/crm/${tenantId}/Deals/new`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Add contact',
      href: `/crm/${tenantId}/Contacts/new`,
      icon: <Users className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Open tasks',
      href: `/crm/${tenantId}/Tasks`,
      variant: 'secondary',
    },
    {
      label: 'Reports',
      href: `/crm/${tenantId}/Reports`,
      variant: 'secondary',
    },
  ]

  const pipelineChartData = (stats.pipelineByStage || []).map((item, idx) => ({
    name: item?.stage
      ? String(item.stage).charAt(0).toUpperCase() + String(item.stage).slice(1)
      : `Stage ${idx + 1}`,
    value: Number(item?.count || 0),
    fill: CHART_COLORS[idx % CHART_COLORS.length],
  }))

  let secondaryTitle = 'Pipeline by stage'
  let secondaryDescription = 'Primary pipeline view — more charts live under Reports'
  let secondary: ReactNode =
    pipelineChartData.length > 0 ? (
      <div className="space-y-3">
        <CrmHomeCharts
          pipelineChartData={pipelineChartData}
          monthlyLeadData={[]}
          topLeadSourcesData={[]}
          isDark={isDark}
          compact
        />
        <p className="text-xs text-slate-500">
          Need deeper analytics?{' '}
          <Link href={`/crm/${tenantId}/Reports`} className="text-[#53328A] hover:underline">
            Open CRM Reports
          </Link>
        </p>
      </div>
    ) : (
      <DashboardEmptyState
        icon={<BarChart3 />}
        title="No pipeline data yet"
        description="Create deals to populate pipeline stages."
        actionLabel="New deal"
        actionHref={`/crm/${tenantId}/Deals/new`}
      />
    )

  if (currentView === 'tasks') {
    secondaryTitle = "Today's work"
    secondaryDescription = 'Open activities and tasks due today'
    secondary =
      tasksToday.length > 0 ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasksToday.slice(0, 8).map((task) => (
            <li key={task.id} className="py-3 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                {task.title}
              </span>
              {task.dueDate ? (
                <span className="text-xs text-slate-500 shrink-0">
                  {new Date(task.dueDate).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <DashboardEmptyState
          icon={<Briefcase />}
          title="No tasks due today"
          description="You're clear for now. Create a task or open the full task board."
          actionLabel="Open tasks"
          actionHref={`/crm/${tenantId}/Tasks`}
        />
      )
  } else if (currentView === 'activity') {
    secondaryTitle = 'Activity feed'
    secondaryDescription = 'Recent CRM events'
    secondary =
      activityItems.length > 0 ? (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {activityItems.slice(0, 10).map((item) => (
            <li key={item.id} className="py-3">
              <p className="text-sm text-slate-800 dark:text-slate-100">
                {item.summary || item.type || 'Activity'}
              </p>
              {item.createdAt ? (
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(item.createdAt).toLocaleString('en-IN')}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <DashboardEmptyState
          title="No recent activity"
          description="Activity will appear here as your team works deals and contacts."
        />
      )
  }

  return (
    <ModuleDashboardShell
      moduleId="crm"
      title="CRM"
      error={error}
      headerExtra={
        <>
          <select
            value={timePeriod}
            onChange={(e) =>
              onTimePeriodChange(e.target.value as 'month' | 'quarter' | 'financial-year' | 'year')
            }
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          >
            <option value="month">This month</option>
            <option value="quarter">This quarter</option>
            <option value="financial-year">This financial year</option>
            <option value="year">This year</option>
          </select>
          <select
            value={currentView}
            onChange={(e) => onViewChange(e.target.value)}
            className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100"
          >
            <option value="manager">Manager home</option>
            <option value="tasks">Tasks view</option>
            <option value="activity">Activity feed</option>
            <option value="pipeline">Pipeline</option>
            <option value="sales">Sales</option>
          </select>
        </>
      }
      kpis={kpis}
      insight={{
        text: insightText,
        status: 'ready',
        href: `/crm/${tenantId}/Reports`,
        hrefLabel: 'More insights',
      }}
      actions={actions}
      secondaryTitle={secondaryTitle}
      secondaryDescription={secondaryDescription}
      secondary={secondary}
    />
  )
}
