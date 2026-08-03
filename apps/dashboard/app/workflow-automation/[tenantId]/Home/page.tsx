'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { GitBranch, Play, Clock, AlertTriangle, Plus, CheckCircle2 } from 'lucide-react'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  DashboardSkeleton,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'
import { getModuleConfig } from '@/lib/modules/module-config'
import {
  fetchAutomationRuns,
  fetchAutomationWorkflows,
  fetchPendingApprovals,
  formatMetricValue,
  type AutomationRun,
  type AutomationWorkflow,
  type PendingApproval,
} from '@/lib/automation/ui-client'

export default function WorkflowAutomationDashboardPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const { token } = useAuthStore()
  const moduleConfig = getModuleConfig('workflow-automation') || getModuleConfig('workflow')!

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([])
  const [runs, setRuns] = useState<AutomationRun[]>([])
  const [approvals, setApprovals] = useState<PendingApproval[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [w, r, a] = await Promise.all([
        fetchAutomationWorkflows(token),
        fetchAutomationRuns(token, { limit: 10 }),
        fetchPendingApprovals(token),
      ])
      setWorkflows(w)
      setRuns(r)
      setApprovals(a)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load automation data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <DashboardSkeleton />

  const activeCount = workflows.filter((w) => w.isActive).length
  const failedCount = runs.filter((r) => r.status === 'FAILED').length

  const kpis: DashboardKpi[] = [
    {
      label: 'Active workflows',
      value: formatMetricValue(false, activeCount),
      icon: <GitBranch className="w-5 h-5" />,
      tone: 'purple',
      href: `/workflow-automation/${tenantId}/Workflows`,
    },
    {
      label: 'Recent runs',
      value: formatMetricValue(false, runs.length),
      icon: <Play className="w-5 h-5" />,
      tone: 'info',
      href: `/workflow-automation/${tenantId}/Runs`,
    },
    {
      label: 'Pending approvals',
      value: formatMetricValue(false, approvals.length),
      icon: <Clock className="w-5 h-5" />,
      tone: approvals.length > 0 ? 'warning' : 'success',
      href: `/workflow-automation/${tenantId}/Approvals`,
    },
    {
      label: 'Failed (recent)',
      value: formatMetricValue(false, failedCount),
      icon: <AlertTriangle className="w-5 h-5" />,
      tone: failedCount > 0 ? 'error' : 'success',
      href: `/workflow-automation/${tenantId}/Runs`,
    },
  ]

  const actions: DashboardAction[] = [
    {
      label: 'Open builder',
      href: `/workflow-automation/${tenantId}/Workflows`,
      icon: <Plus className="w-4 h-4" />,
    },
    {
      label: 'Run history',
      href: `/workflow-automation/${tenantId}/Runs`,
      variant: 'secondary',
    },
    {
      label: approvals.length > 0 ? `Approvals (${approvals.length})` : 'Approvals',
      href: `/workflow-automation/${tenantId}/Approvals`,
      variant: 'secondary',
    },
  ]

  return (
    <ModuleDashboardShell
      moduleId="workflow-automation"
      title="Workflow Automation"
      moduleIcon={<moduleConfig.icon className="w-7 h-7" />}
      subtitle="Builder · runs · approvals"
      error={error}
      kpis={kpis}
      insight={{
        text:
          activeCount > 0
            ? `${activeCount} active workflow${activeCount === 1 ? '' : 's'} · ${failedCount} failed in recent runs · ${approvals.length} pending approval${approvals.length === 1 ? '' : 's'}.`
            : 'No active workflows yet. Open the builder to create one, or wait for an event trigger.',
        status: workflows.length > 0 ? 'ready' : 'unavailable',
        href: `/workflow-automation/${tenantId}/Workflows`,
        hrefLabel: 'Open builder',
      }}
      actions={actions}
      secondaryTitle="Recent runs"
      secondaryDescription="Live WorkflowExecution data — not sample KPIs"
      secondaryActions={
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-[#53328A] hover:underline"
        >
          Refresh
        </button>
      }
      secondary={
        runs.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {runs.map((run) => (
              <li key={run.runId} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">
                    {run.workflowName || run.workflowId}
                  </p>
                  <p className="text-xs text-slate-500">
                    {run.eventType || 'manual'} · {new Date(run.startedAt).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                  {run.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <DashboardEmptyState
            icon={<Play />}
            title="No runs yet"
            description="Create a workflow and execute it, or wait for an event trigger."
            actionLabel="Open builder"
            actionHref={`/workflow-automation/${tenantId}/Workflows`}
          />
        )
      }
    >
      {approvals.length > 0 ? (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 flex items-center gap-2 text-sm">
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
          <Link
            href={`/workflow-automation/${tenantId}/Approvals`}
            className="text-amber-800 dark:text-amber-200 font-medium hover:underline"
          >
            {approvals.length} approval{approvals.length === 1 ? '' : 's'} waiting
          </Link>
        </div>
      ) : null}
    </ModuleDashboardShell>
  )
}
