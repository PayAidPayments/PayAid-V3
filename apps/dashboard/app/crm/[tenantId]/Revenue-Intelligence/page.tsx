'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { PageLoading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { BarChart3, Clock, GitBranch, Target, TrendingUp, LineChart, Link2 } from 'lucide-react'
import { formatINRStandard } from '@/lib/utils/formatINR'

type Funnel = {
  open_deal_count: number
  open_pipeline_value_inr: number
  closed_won_count_30d: number
  closed_won_value_inr_30d: number
  closed_won_count_prev_30d: number
  closed_won_value_inr_prev_30d: number
  stages: Array<{ stage: string; deal_count: number; total_value_inr: number; percent_of_open_pipeline?: number }>
  as_of: string
}

type Velocity = {
  window_days: number
  avg_days_open_deal_age: number | null
  median_days_open_deal_age: number | null
  by_stage: Array<{
    stage: string
    deal_count: number
    avg_days_since_created: number | null
    median_days_since_created: number | null
  }>
  won_deals_in_window: { count: number; total_value_inr: number }
}

type NextActions = {
  recommendations: Array<{
    id: string
    deal_id: string
    deal_name: string
    stage: string
    value_inr: number
    risk_score: number
    recommendation_rationale: string
    suggested_action: string
  }>
}

type WonTimeseries = {
  months: number
  points: Array<{ month_start: string; won_deal_count: number; won_value_inr: number }>
}

export default function RevenueIntelligencePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()

  const funnelQuery = useQuery({
    queryKey: ['revenue-funnel', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/revenue/funnel')
      if (res.status === 403) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Feature disabled')
      }
      if (!res.ok) throw new Error('Failed to load funnel')
      return res.json() as Promise<Funnel>
    },
    enabled: !!tenantId,
  })

  const velocityQuery = useQuery({
    queryKey: ['revenue-velocity', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/revenue/velocity?windowDays=30')
      if (!res.ok) throw new Error('Failed to load velocity')
      return res.json() as Promise<Velocity>
    },
    enabled: !!tenantId,
  })

  const actionsQuery = useQuery({
    queryKey: ['revenue-next-actions', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/revenue/insights/next-actions?limit=12')
      if (!res.ok) throw new Error('Failed to load recommendations')
      return res.json() as Promise<NextActions>
    },
    enabled: !!tenantId,
  })

  const wonTsQuery = useQuery({
    queryKey: ['revenue-won-timeseries', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/revenue/won-timeseries?months=6')
      if (!res.ok) throw new Error('Failed to load won time series')
      return res.json() as Promise<WonTimeseries>
    },
    enabled: !!tenantId,
  })

  const feedbackMutation = useMutation({
    mutationFn: async (payload: { recommendation_id: string; deal_id: string; accepted: boolean }) => {
      const idem =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `fb-${Date.now()}`
      const res = await apiRequest('/api/v1/revenue/feedback', {
        method: 'POST',
        headers: { 'x-idempotency-key': `revenue-iq-ui:${idem}` },
        body: JSON.stringify({ ...payload }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Feedback failed')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revenue-next-actions', tenantId] })
    },
  })

  const loading = funnelQuery.isLoading || velocityQuery.isLoading || actionsQuery.isLoading || wonTsQuery.isLoading
  const err =
    funnelQuery.error || velocityQuery.error || actionsQuery.error || wonTsQuery.error
      ? (funnelQuery.error || velocityQuery.error || actionsQuery.error || wonTsQuery.error) as Error
      : null

  if (!tenantId) return <PageLoading message="Loading…" fullScreen={false} />
  if (loading && !funnelQuery.data) {
    return <PageLoading message="Loading revenue intelligence…" fullScreen={false} />
  }

  const funnel = funnelQuery.data
  const velocity = velocityQuery.data
  const nextActions = actionsQuery.data
  const wonTs = wonTsQuery.data

  const leakStages =
    velocity?.by_stage.filter(
      (s) =>
        (s.avg_days_since_created != null && s.avg_days_since_created >= 14 && s.deal_count > 0) ||
        (s.median_days_since_created != null && s.median_days_since_created >= 14 && s.deal_count > 0)
    ) ?? []

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Revenue Intelligence</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Funnel, velocity, and next actions from your CRM deals (same data as{' '}
            <Link href={`/crm/${tenantId}/Deals`} className="text-slate-700 dark:text-slate-300 underline font-medium">
              Pipeline
            </Link>
            ).
          </p>
        </div>
        <Link
          href={`/crm/${tenantId}/Metrics`}
          className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 inline-flex items-center gap-1.5"
        >
          <LineChart className="w-4 h-4" />
          Phase 1A metrics
        </Link>
      </div>

      {err && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-200">
          {err.message.includes('disabled') || err.message.includes('Feature')
            ? 'Revenue Intelligence may be disabled for this tenant (`m1_revenue_intelligence`), or you lack CRM audit access.'
            : err.message}
        </div>
      )}

      {/* Band 0 — stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Open pipeline"
          value={funnel ? formatINRStandard(funnel.open_pipeline_value_inr) : '—'}
          subtitle={`${funnel?.open_deal_count ?? '—'} open deals`}
          icon={<Target className="w-4 h-4" />}
        />
        <StatCard
          title="Won (30d)"
          value={funnel ? formatINRStandard(funnel.closed_won_value_inr_30d) : '—'}
          subtitle={
            funnel
              ? `${funnel.closed_won_count_30d} deals · prior 30d: ${funnel.closed_won_count_prev_30d} · ${formatINRStandard(funnel.closed_won_value_inr_prev_30d)}`
              : '—'
          }
          icon={<TrendingUp className="w-4 h-4" />}
        />
        <StatCard
          title="Median deal age"
          value={
            velocity?.median_days_open_deal_age != null
              ? `${Math.round(velocity.median_days_open_deal_age)} d`
              : '—'
          }
          subtitle="Open deals (days since created)"
          icon={<Clock className="w-4 h-4" />}
        />
        <StatCard
          title="Won in window"
          value={velocity ? formatINRStandard(velocity.won_deals_in_window.total_value_inr) : '—'}
          subtitle={`${velocity?.window_days ?? 30}d · ${velocity?.won_deals_in_window.count ?? '—'} deals`}
          icon={<BarChart3 className="w-4 h-4" />}
        />
      </div>

      {funnel && (
        <ChartCard
          title="Closed won — last 30d vs prior 30d"
          subtitle="Normalized by the larger period value; counts from CRM won deals (funnel API)"
        >
          {(() => {
            const last = funnel.closed_won_value_inr_30d
            const prev = funnel.closed_won_value_inr_prev_30d
            const max = Math.max(last, prev, 1)
            const wLast = Math.min(100, Math.max(4, (last / max) * 100))
            const wPrev = Math.min(100, Math.max(4, (prev / max) * 100))
            return (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-800 dark:text-slate-100">Last 30 days</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatINRStandard(last)} · {funnel.closed_won_count_30d} deals
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600 dark:bg-emerald-500 transition-all"
                      style={{ width: `${wLast}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-slate-800 dark:text-slate-100">Prior 30 days</span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {formatINRStandard(prev)} · {funnel.closed_won_count_prev_30d} deals
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-slate-500 dark:bg-slate-400 transition-all"
                      style={{ width: `${wPrev}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })()}
        </ChartCard>
      )}

      {wonTs?.points?.length ? (
        <ChartCard title="Won trend (monthly)" subtitle={`Last ${wonTs.months} months · won value + count (UTC month buckets)`}>
          <div className="space-y-3">
            {wonTs.points.map((p) => {
              const d = new Date(p.month_start)
              const label = d.toLocaleString(undefined, { month: 'short', year: '2-digit' })
              return (
                <div key={p.month_start} className="flex items-center gap-3">
                  <div className="w-16 text-xs text-slate-500 dark:text-slate-400 tabular-nums">{label}</div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                      <span>{p.won_deal_count} deals</span>
                      <span>{formatINRStandard(p.won_value_inr)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-700 dark:bg-slate-300 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              2,
                              (p.won_value_inr /
                                Math.max(...wonTs.points.map((x) => x.won_value_inr), 1)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard title="Pipeline funnel" subtitle="Open deals by stage (value and mix)">
          {!funnel?.stages?.length ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No open pipeline data.</p>
          ) : (
            <div className="space-y-4">
              {funnel.stages.map((s) => {
                const pct = Math.round((s.percent_of_open_pipeline ?? 0) * 100)
                return (
                  <div key={s.stage}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-800 dark:text-slate-100 capitalize">{s.stage}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {s.deal_count} deals · {formatINRStandard(s.total_value_inr)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-600 dark:bg-slate-400 transition-all"
                        style={{ width: `${Math.min(100, Math.max(pct, 2))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">As of {funnel?.as_of ?? '—'}</p>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Velocity & leak signals" subtitle="Stages with slower movement (avg age ≥ 14 days)">
          {leakStages.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No stages flagged as slow in the last window, or insufficient data.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {leakStages.map((s) => (
                <li
                  key={s.stage}
                  className="flex justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0"
                >
                  <span className="font-medium capitalize text-slate-800 dark:text-slate-100">{s.stage}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    ~{s.avg_days_since_created != null ? Math.round(s.avg_days_since_created) : '—'}d avg age ·{' '}
                    {s.deal_count} deals
                  </span>
                </li>
              ))}
            </ul>
          )}
          {velocity && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <GitBranch className="w-3.5 h-3.5 inline mr-1" />
              Full stage breakdown uses the same open deals as Pipeline; median age{' '}
              {velocity.median_days_open_deal_age != null
                ? `${Math.round(velocity.median_days_open_deal_age)} days`
                : 'n/a'}
              .
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Next actions" subtitle="Ranked from open deals (risk + value); accept or reject to log feedback">
        {!nextActions?.recommendations?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No recommendations right now.</p>
        ) : (
          <div className="space-y-4">
            {nextActions.recommendations.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/crm/${tenantId}/Deals/${r.deal_id}`}
                      className="text-sm font-semibold text-slate-900 dark:text-slate-50 hover:underline truncate"
                    >
                      {r.deal_name}
                    </Link>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                      {r.stage}
                    </span>
                    <span className="text-xs text-slate-500">Risk {Math.round(r.risk_score * 100)}%</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{r.recommendation_rationale}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Suggested: {r.suggested_action.replace(/_/g, ' ')} · {formatINRStandard(r.value_inr)}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={feedbackMutation.isPending}
                    title={feedbackMutation.isPending ? 'Please wait' : 'Reject'}
                    onClick={() =>
                      feedbackMutation.mutate({
                        recommendation_id: r.id,
                        deal_id: r.deal_id,
                        accepted: false,
                      })
                    }
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={feedbackMutation.isPending}
                    title={feedbackMutation.isPending ? 'Please wait' : 'Accept'}
                    className="dark:bg-slate-700"
                    onClick={() =>
                      feedbackMutation.mutate({
                        recommendation_id: r.id,
                        deal_id: r.deal_id,
                        accepted: true,
                      })
                    }
                  >
                    {feedbackMutation.isPending ? 'Saving…' : 'Accept'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>

      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
        <Link2 className="w-3.5 h-3.5" />
        APIs: <code className="text-[11px]">/api/v1/revenue/funnel</code>,{' '}
        <code className="text-[11px]">velocity</code>, <code className="text-[11px]">insights/next-actions</code>,{' '}
        <code className="text-[11px]">feedback</code>
      </p>
    </div>
  )
}
