'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { PageLoading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  BarChart3, Clock, GitBranch, Target, TrendingUp, LineChart, Link2,
  LayoutGrid, Users, Globe, Package,
} from 'lucide-react'
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

type LTVContact = {
  contact_id: string
  contact_name: string
  contact_email: string | null
  total_deals: number
  total_value: number
  avg_deal_value: number
  first_close: string | null
  last_close: string | null
  tenure_days: number | null
  predicted_annual_ltv: number | null
}

type LTVData = {
  window_days: number
  limit: number
  total_contacts: number
  contacts: LTVContact[]
  generated_at: string
}

type DealHealthResult = {
  deal_id: string
  deal_name: string
  stage: string
  value: number
  health_score: number
  health_label: string
  top_factor: string
  computed_at: string
}

type DealHealthBatch = {
  results: DealHealthResult[]
  found: number
  requested: number
  computed_at: string
}

type ForecastBucket = {
  label: string
  period: string
  deal_count: number
  best_case_inr: number
  most_likely_inr: number
  commit_inr: number
}

type ForecastSummary = {
  total_open_deals: number
  best_case_inr: number
  most_likely_inr: number
  commit_inr: number
  pipeline_gap_inr: number | null
}

type ForecastData = {
  window_days: number
  target_inr: number | null
  summary: ForecastSummary
  buckets: ForecastBucket[]
  generated_at: string
}

type CohortGroup = 'size' | 'rep' | 'source'

type Cohort = {
  key: string
  label: string
  total_closed: number
  won: number
  lost: number
  win_rate_pct: number
  total_value: number
  avg_deal_value: number
}

type CohortData = {
  cohorts: Cohort[]
  total_closed_in_window: number
  total_won_in_window: number
  group_by: string
  window_days: number
}

const COHORT_GROUPS: { id: CohortGroup; label: string; icon: React.ReactNode }[] = [
  { id: 'size', label: 'Deal Size', icon: <Package className="w-3.5 h-3.5" /> },
  { id: 'rep', label: 'Sales Rep', icon: <Users className="w-3.5 h-3.5" /> },
  { id: 'source', label: 'Lead Source', icon: <Globe className="w-3.5 h-3.5" /> },
]

function healthLabelColor(label: string) {
  if (label === 'healthy') return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
  if (label === 'moderate') return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
  if (label === 'at_risk') return 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300'
  return 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
}

function winRateColor(pct: number) {
  if (pct >= 65) return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
  if (pct >= 40) return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
  return 'bg-red-100 dark:bg-red-950/50 text-red-800 dark:text-red-300'
}

export default function RevenueIntelligencePage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const queryClient = useQueryClient()
  const [cohortGroup, setCohortGroup] = useState<CohortGroup>('size')

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

  const cohortQuery = useQuery({
    queryKey: ['revenue-cohorts', tenantId, cohortGroup],
    queryFn: async () => {
      const res = await apiRequest(`/api/v1/revenue/cohorts?group_by=${cohortGroup}&window_days=90`)
      if (res.status === 403) return null
      if (!res.ok) throw new Error('Failed to load cohorts')
      return res.json() as Promise<CohortData>
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  })

  const ltvQuery = useQuery({
    queryKey: ['revenue-ltv', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/revenue/ltv?limit=10&window_days=365')
      if (res.status === 403) return null
      if (!res.ok) throw new Error('Failed to load LTV data')
      return res.json() as Promise<LTVData>
    },
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000,
  })

  const forecastQuery = useQuery({
    queryKey: ['revenue-forecast', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/revenue/forecast?window_days=90')
      if (res.status === 403) return null
      if (!res.ok) throw new Error('Failed to load forecast')
      return res.json() as Promise<ForecastData>
    },
    enabled: !!tenantId,
    staleTime: 10 * 60 * 1000,
  })

  const dealHealthDealIds = actionsQuery.data?.recommendations?.slice(0, 10).map((r) => r.deal_id) ?? []

  const dealHealthQuery = useQuery({
    queryKey: ['deal-health-batch', tenantId, dealHealthDealIds],
    queryFn: async () => {
      if (!dealHealthDealIds.length) return null
      const res = await apiRequest('/api/v1/revenue/deal-health/batch', {
        method: 'POST',
        body: JSON.stringify({ deal_ids: dealHealthDealIds }),
      })
      if (res.status === 403) return null
      if (!res.ok) throw new Error('Failed to load deal health scores')
      return res.json() as Promise<DealHealthBatch>
    },
    enabled: !!tenantId && !actionsQuery.isLoading,
    staleTime: 5 * 60 * 1000,
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
            ? 'Revenue Intelligence may be disabled for this tenant (`m1_revenue_intelligence`).'
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

      {/* Band 2 — Cohort heatmap */}
      <ChartCard
        title="Win-rate matrix"
        subtitle="Closed deals in last 90 days segmented by cohort — colour: ≥65% green · 40–65% amber · <40% red"
      >
        {/* Group-by selector */}
        <div className="flex flex-wrap gap-2 mb-5">
          {COHORT_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setCohortGroup(g.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                cohortGroup === g.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {g.icon}
              {g.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 self-center">
            {cohortQuery.isLoading ? 'Loading…' : '90-day window'}
          </span>
        </div>

        {cohortQuery.data === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Revenue Intelligence feature is disabled for this tenant.
          </p>
        ) : !cohortQuery.data?.cohorts?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No closed deals in the last 90 days to group by{' '}
            {COHORT_GROUPS.find((g) => g.id === cohortGroup)?.label.toLowerCase() ?? cohortGroup}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="py-2 pr-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {COHORT_GROUPS.find((g) => g.id === cohortGroup)?.label}
                  </th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Closed
                  </th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Won
                  </th>
                  <th className="py-2 px-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Win Rate
                  </th>
                  <th className="py-2 pl-3 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Avg Deal
                  </th>
                </tr>
              </thead>
              <tbody>
                {cohortQuery.data.cohorts.map((c) => (
                  <tr
                    key={c.key}
                    className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">{c.label}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {c.total_closed}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {c.won}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${winRateColor(c.win_rate_pct)}`}
                      >
                        {c.win_rate_pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 pl-3 text-right tabular-nums text-slate-600 dark:text-slate-300">
                      {formatINRStandard(c.avg_deal_value)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <td className="py-2 pr-4 text-xs text-slate-500 dark:text-slate-400 font-semibold">Total</td>
                  <td className="py-2 px-3 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                    {cohortQuery.data.total_closed_in_window}
                  </td>
                  <td className="py-2 px-3 text-right text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                    {cohortQuery.data.total_won_in_window}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums ${winRateColor(
                        cohortQuery.data.total_closed_in_window > 0
                          ? (cohortQuery.data.total_won_in_window / cohortQuery.data.total_closed_in_window) * 100
                          : 0
                      )}`}
                    >
                      {cohortQuery.data.total_closed_in_window > 0
                        ? (
                            (cohortQuery.data.total_won_in_window / cohortQuery.data.total_closed_in_window) *
                            100
                          ).toFixed(1)
                        : '—'}
                      %
                    </span>
                  </td>
                  <td className="py-2 pl-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </ChartCard>

      {/* Band 3 — LTV top-10 accounts */}
      <ChartCard
        title="Top accounts by Lifetime Value"
        subtitle="Contacts ranked by total closed-won deal value in the last 365 days"
      >
        {ltvQuery.isLoading ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">Loading LTV data…</p>
        ) : ltvQuery.data === null ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Revenue Intelligence feature is disabled for this tenant.
          </p>
        ) : !ltvQuery.data?.contacts?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No closed-won deals linked to contacts in the last 365 days.
          </p>
        ) : (
          <div className="space-y-3">
            {(() => {
              const maxVal = Math.max(...ltvQuery.data.contacts.map((c) => c.total_value), 1)
              return ltvQuery.data.contacts.map((c, i) => (
                <div key={c.contact_id} className="flex items-center gap-3">
                  <div className="w-5 text-xs font-semibold tabular-nums text-slate-400 dark:text-slate-500 text-right">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate max-w-[55%]">
                        {c.contact_name}
                      </span>
                      <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                        {formatINRStandard(c.total_value)} · {c.total_deals} deal{c.total_deals !== 1 ? 's' : ''}
                        {c.predicted_annual_ltv != null && (
                          <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                            · {formatINRStandard(c.predicted_annual_ltv)}/yr
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 dark:bg-indigo-400 transition-all"
                        style={{ width: `${Math.max((c.total_value / maxVal) * 100, 2)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            })()}
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
              Showing {ltvQuery.data.contacts.length} of {ltvQuery.data.total_contacts} qualifying contacts
              · Annual LTV shown for contacts with ≥90 days deal history
            </p>
          </div>
        )}
      </ChartCard>

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

      {/* Band 4 — Pipeline Forecast */}
      <ChartCard
        title="Pipeline forecast (90-day)"
        subtitle="Probability-weighted revenue by expected close date · commit = deals ≥70% probability"
      >
        {forecastQuery.isLoading ? (
          <div className="py-4 text-center text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            Computing forecast…
          </div>
        ) : !forecastQuery.data ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Revenue forecast is not available. Enable the{' '}
            <code className="text-[11px]">m1_revenue_intelligence</code> feature flag to see pipeline projections.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Commit', value: forecastQuery.data.summary.commit_inr, color: 'text-emerald-600 dark:text-emerald-400', note: '≥70% probability' },
                { label: 'Most likely', value: forecastQuery.data.summary.most_likely_inr, color: 'text-blue-600 dark:text-blue-400', note: 'Probability weighted' },
                { label: 'Best case', value: forecastQuery.data.summary.best_case_inr, color: 'text-slate-700 dark:text-slate-300', note: '100% of open deals' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3"
                >
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className={`text-lg font-semibold mt-0.5 ${s.color}`}>{formatINRStandard(s.value)}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{s.note}</p>
                </div>
              ))}
            </div>

            {/* Per-bucket table */}
            <div className="space-y-1.5">
              {forecastQuery.data.buckets
                .filter((b) => b.deal_count > 0)
                .map((b) => (
                  <div
                    key={b.label}
                    className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 dark:border-slate-800 last:border-0 text-sm"
                  >
                    <div className="min-w-0">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{b.label}</span>
                      <span className="ml-2 text-xs text-slate-400">{b.deal_count} deal{b.deal_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-4 text-right shrink-0 text-xs">
                      <span className="text-emerald-700 dark:text-emerald-400">
                        {formatINRStandard(b.commit_inr)} commit
                      </span>
                      <span className="text-blue-700 dark:text-blue-400">
                        {formatINRStandard(b.most_likely_inr)} likely
                      </span>
                    </div>
                  </div>
                ))}
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              {forecastQuery.data.summary.total_open_deals} open deals · generated{' '}
              {new Date(forecastQuery.data.generated_at).toLocaleTimeString()}
            </p>
          </div>
        )}
      </ChartCard>

      {/* Band 5 — At-risk deal health leaderboard */}
      <ChartCard
        title="Deal health leaderboard"
        subtitle="Open deals from your pipeline ranked by health score — lowest first (needs most attention)"
      >
        {dealHealthQuery.isLoading ? (
          <div className="py-4 text-center text-sm text-slate-500 dark:text-slate-400 animate-pulse">
            Computing health scores…
          </div>
        ) : !dealHealthQuery.data?.results?.length ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No open deals to evaluate. Add deals in Pipeline or enable Revenue Intelligence to see health scores here.
          </p>
        ) : (
          <div className="space-y-1">
            {dealHealthQuery.data.results
              .filter((d) => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
              .sort((a, b) => a.health_score - b.health_score)
              .slice(0, 8)
              .map((deal) => (
                <div
                  key={deal.deal_id}
                  className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/crm/${tenantId}/Deals/${deal.deal_id}`}
                      className="text-sm font-semibold text-slate-800 dark:text-slate-100 hover:underline truncate block"
                    >
                      {deal.deal_name}
                    </Link>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      <span className="capitalize">{deal.stage?.replace(/_/g, ' ')}</span>
                      {deal.top_factor
                        ? ` · Risk: ${deal.top_factor.replace(/_/g, ' ')}`
                        : ''}
                      {' · '}
                      {formatINRStandard(deal.value ?? 0)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${healthLabelColor(deal.health_label)}`}
                    >
                      {deal.health_label?.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 w-8 text-right tabular-nums">
                      {deal.health_score}
                    </span>
                  </div>
                </div>
              ))}
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-2">
              Showing up to 8 lowest-scoring open deals · scores computed at{' '}
              {dealHealthQuery.data.computed_at
                ? new Date(dealHealthQuery.data.computed_at).toLocaleTimeString()
                : '—'}
            </p>
          </div>
        )}
      </ChartCard>

      <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
        <Link2 className="w-3.5 h-3.5" />
        APIs: <code className="text-[11px]">/api/v1/revenue/funnel</code>,{' '}
        <code className="text-[11px]">velocity</code>,{' '}
        <code className="text-[11px]">cohorts</code>,{' '}
        <code className="text-[11px]">ltv</code>,{' '}
        <code className="text-[11px]">forecast</code>,{' '}
        <code className="text-[11px]">deal-health/[id]</code>,{' '}
        <code className="text-[11px]">deal-health/batch</code>,{' '}
        <code className="text-[11px]">insights/next-actions</code>,{' '}
        <code className="text-[11px]">feedback</code>
      </p>
    </div>
  )
}
