'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import { PageLoading } from '@/components/ui/loading'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Zap,
  Target,
  Bot,
  ListOrdered,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type KpiStatus = 'on_target' | 'needs_review' | 'active' | 'inactive'

interface Scorecard {
  window_days: number
  since: string
  generated_at: string
  schema_version: string
  metrics: {
    signal_to_first_action: {
      median_ms: number | null
      p95_ms: number | null
      sample_count: number
      status: KpiStatus
    }
    deal_stage_velocity: {
      total_deals_updated: number
      won_deals: number
      win_rate_pct: number | null
      status: KpiStatus
    }
    quote_to_invoice_conversion: {
      conversions_in_window: number
      median_hours: number | null
      status: KpiStatus
    }
    automation_reliability: {
      total_runs: number
      failed_runs: number
      failure_rate_pct: number | null
      status: KpiStatus
    }
    unibox_sla: {
      conversations_ingested: number
      conversations_resolved: number
      resolution_rate_pct: number | null
      status: KpiStatus
    }
    ai_suggestion_acceptance: {
      total_calls: number
      ai_handled_calls: number
      ai_acceptance_rate_pct: number | null
      status: KpiStatus
    }
    sdr_sequence_runs: {
      total_runs: number
      status: KpiStatus
    }
    sequence_enrollment_conversion: {
      total_enrollments: number
      positive_replies: number
      replied_enrollments: number
      conversion_rate_pct: number | null
      reply_rate_pct: number | null
      status: KpiStatus
    }
  }
}

interface RecommendationsPayload {
  window_days: number
  generated_at: string
  recommendations: Array<{
    id: string
    priority: 'high' | 'medium' | 'low'
    title: string
    reason: string
    suggested_action: string
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMs(ms: number | null): string {
  if (ms === null) return '—'
  if (ms < 1000) return `${ms.toFixed(0)} ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} s`
  return `${(ms / 60000).toFixed(1)} min`
}

function fmtPct(v: number | null): string {
  if (v === null) return '—'
  return `${v.toFixed(1)}%`
}

function fmtSigned(v: number | null, suffix = ''): string {
  if (v === null) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(1)}${suffix}`
}

function StatusPill({ status }: { status: KpiStatus }) {
  if (status === 'on_target' || status === 'active') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 text-[10px] px-2 py-0.5 font-medium">
        <CheckCircle2 className="w-3 h-3 mr-1 inline" />
        {status === 'active' ? 'Active' : 'On Target'}
      </Badge>
    )
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0 text-[10px] px-2 py-0.5 font-medium">
      <AlertTriangle className="w-3 h-3 mr-1 inline" />
      {status === 'inactive' ? 'Inactive' : 'Needs Review'}
    </Badge>
  )
}

const WINDOWS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [windowDays, setWindowDays] = useState(7)

  const { data, isLoading, error, refetch, isFetching } = useQuery<Scorecard>({
    queryKey: ['kpi-scorecard', tenantId, windowDays],
    queryFn: async () => {
      const res = await apiRequest(`/api/v1/kpi/scorecard?window_days=${windowDays}`)
      if (!res.ok) throw new Error('Failed to load KPI scorecard')
      return res.json()
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  })

  const { data: baseline } = useQuery<Scorecard>({
    queryKey: ['kpi-scorecard-baseline', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/v1/kpi/scorecard?window_days=90')
      if (!res.ok) throw new Error('Failed to load KPI baseline')
      return res.json()
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  })

  const { data: recommendations } = useQuery<RecommendationsPayload>({
    queryKey: ['kpi-recommendations', tenantId, windowDays],
    queryFn: async () => {
      const res = await apiRequest(`/api/v1/kpi/recommendations?window_days=${windowDays}`)
      if (!res.ok) throw new Error('Failed to load KPI recommendations')
      return res.json()
    },
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000,
  })

  if (!tenantId) return <PageLoading message="Loading…" fullScreen={false} />
  if (isLoading) return <PageLoading message="Loading KPI Scorecard…" fullScreen={false} />

  const m = data?.metrics

  // ── Derived bar-chart data ─────────────────────────────────────────────────
  const reliabilityChart = m
    ? [
        { name: 'Total Runs', value: m.automation_reliability.total_runs, fill: '#6366f1' },
        { name: 'Failed Runs', value: m.automation_reliability.failed_runs, fill: '#f43f5e' },
        { name: 'SDR Runs', value: m.sdr_sequence_runs.total_runs, fill: '#10b981' },
      ]
    : []

  const conversionChart = m
    ? [
        { name: 'Conversations', value: m.unibox_sla.conversations_ingested, fill: '#6366f1' },
        { name: 'Resolved', value: m.unibox_sla.conversations_resolved, fill: '#10b981' },
        { name: 'AI Calls', value: m.ai_suggestion_acceptance.total_calls, fill: '#f59e0b' },
        { name: 'AI Handled', value: m.ai_suggestion_acceptance.ai_handled_calls, fill: '#10b981' },
      ]
    : []

  const funnelChart = m
    ? [
        { name: 'Total Deals', value: m.deal_stage_velocity.total_deals_updated, fill: '#6366f1' },
        { name: 'Won', value: m.deal_stage_velocity.won_deals, fill: '#10b981' },
        { name: 'Quotes Converted', value: m.quote_to_invoice_conversion.conversions_in_window, fill: '#f59e0b' },
      ]
    : []

  const benchmark = m && baseline?.metrics
    ? {
        winRateDelta: (m.deal_stage_velocity.win_rate_pct ?? 0) - (baseline.metrics.deal_stage_velocity.win_rate_pct ?? 0),
        uniboxDelta: (m.unibox_sla.resolution_rate_pct ?? 0) - (baseline.metrics.unibox_sla.resolution_rate_pct ?? 0),
        aiDelta:
          (m.ai_suggestion_acceptance.ai_acceptance_rate_pct ?? 0) -
          (baseline.metrics.ai_suggestion_acceptance.ai_acceptance_rate_pct ?? 0),
        failureDelta:
          (m.automation_reliability.failure_rate_pct ?? 0) -
          (baseline.metrics.automation_reliability.failure_rate_pct ?? 0),
        latencyDelta:
          ((m.signal_to_first_action.median_ms ?? 0) - (baseline.metrics.signal_to_first_action.median_ms ?? 0)) / 1000,
        quoteTimeDelta:
          (m.quote_to_invoice_conversion.median_hours ?? 0) -
          (baseline.metrics.quote_to_invoice_conversion.median_hours ?? 0),
      }
    : null

  const varianceDrivers = benchmark
    ? [
        {
          label: 'Win rate movement',
          delta: benchmark.winRateDelta,
          good: benchmark.winRateDelta >= 0,
          text: `${fmtSigned(benchmark.winRateDelta, 'pp')} vs 90-day baseline`,
        },
        {
          label: 'Automation failure shift',
          delta: Math.abs(benchmark.failureDelta),
          good: benchmark.failureDelta <= 0,
          text: `${fmtSigned(benchmark.failureDelta, 'pp')} failure rate vs 90-day baseline`,
        },
        {
          label: 'Signal latency shift',
          delta: Math.abs(benchmark.latencyDelta),
          good: benchmark.latencyDelta <= 0,
          text: `${fmtSigned(benchmark.latencyDelta, 's')} median latency vs 90-day baseline`,
        },
        {
          label: 'Quote conversion time shift',
          delta: Math.abs(benchmark.quoteTimeDelta),
          good: benchmark.quoteTimeDelta <= 0,
          text: `${fmtSigned(benchmark.quoteTimeDelta, 'h')} median quote→invoice time`,
        },
      ]
        .sort((a, b) => b.delta - a.delta)
        .slice(0, 3)
    : []

  return (
    <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-50">KPI Scorecard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Weekly performance metrics across automation, AI, deals, and revenue
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Window selector */}
          <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {WINDOWS.map((w) => (
              <button
                key={w.value}
                type="button"
                onClick={() => setWindowDays(w.value)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  windowDays === w.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Failed to load KPI scorecard — check your connection and retry.
        </div>
      )}

      {/* ── Band 0 — Top stat bar ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="WIN RATE"
          value={fmtPct(m?.deal_stage_velocity.win_rate_pct ?? null)}
          subtitle={`${m?.deal_stage_velocity.won_deals ?? 0} won of ${m?.deal_stage_velocity.total_deals_updated ?? 0} deals`}
          icon={<Target className="w-4 h-4 text-indigo-500" />}
        />
        <StatCard
          title="AUTOMATION RUNS"
          value={String(m?.automation_reliability.total_runs ?? 0)}
          subtitle={`Failure rate: ${fmtPct(m?.automation_reliability.failure_rate_pct ?? null)}`}
          icon={<Zap className="w-4 h-4 text-indigo-500" />}
        />
        <StatCard
          title="UNIBOX RESOLUTION"
          value={fmtPct(m?.unibox_sla.resolution_rate_pct ?? null)}
          subtitle={`${m?.unibox_sla.conversations_resolved ?? 0} of ${m?.unibox_sla.conversations_ingested ?? 0} conversations`}
          icon={<MessageSquare className="w-4 h-4 text-indigo-500" />}
        />
        <StatCard
          title="AI ACCEPTANCE"
          value={fmtPct(m?.ai_suggestion_acceptance.ai_acceptance_rate_pct ?? null)}
          subtitle={`${m?.ai_suggestion_acceptance.ai_handled_calls ?? 0} of ${m?.ai_suggestion_acceptance.total_calls ?? 0} calls AI-handled`}
          icon={<Bot className="w-4 h-4 text-indigo-500" />}
        />
      </div>

      {/* ── Band 1 — AI Command Center ──────────────────────────────────────── */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-800/60 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-300">
              AI Operations Center
            </span>
          </div>
          <p className="text-xs text-indigo-700 dark:text-indigo-400 leading-relaxed max-w-xl">
            {m?.signal_to_first_action.sample_count
              ? `Median signal-to-action latency across ${m.signal_to_first_action.sample_count} signal pairs: ${fmtMs(m.signal_to_first_action.median_ms)} (p95: ${fmtMs(m.signal_to_first_action.p95_ms)}). `
              : 'No signal-to-action pairs recorded in this window. '}
            {m?.quote_to_invoice_conversion.conversions_in_window
              ? `${m.quote_to_invoice_conversion.conversions_in_window} quotes converted to invoice in median ${m.quote_to_invoice_conversion.median_hours?.toFixed(1) ?? '—'} hrs.`
              : 'No quote-to-invoice conversions in this window.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {m &&
            Object.entries(m).map(([key, metric]) => {
              const labels: Record<string, string> = {
                signal_to_first_action: 'Signal Latency',
                deal_stage_velocity: 'Win Rate',
                quote_to_invoice_conversion: 'CPQ→Invoice',
                automation_reliability: 'Automation',
                unibox_sla: 'Unibox SLA',
                ai_suggestion_acceptance: 'AI Acceptance',
                sdr_sequence_runs: 'SDR Runs',
              }
              return (
                <StatusPill key={key} status={(metric as { status: KpiStatus }).status} />
              )
            })}
        </div>
      </div>

      {/* ── Benchmark overlay ──────────────────────────────────────────────── */}
      <ChartCard
        title="Benchmark Overlay"
        subtitle={`Current ${windowDays}-day metrics vs 90-day baseline`}
      >
        {!benchmark ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">Benchmark data unavailable.</p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Win rate delta</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{fmtSigned(benchmark.winRateDelta, 'pp')}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Automation failure delta</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{fmtSigned(benchmark.failureDelta, 'pp')}</p>
              </div>
              <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">Signal latency delta</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">{fmtSigned(benchmark.latencyDelta, 's')}</p>
              </div>
            </div>
            <div className="space-y-2">
              {varianceDrivers.map((v) => (
                <div key={v.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400">{v.label}</span>
                  <span className={v.good ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}>
                    {v.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </ChartCard>

      <ChartCard
        title="Proactive AI Recommendations"
        subtitle={`Next-best actions derived from ${windowDays}-day KPI signals`}
      >
        <div className="space-y-2">
          {(recommendations?.recommendations ?? []).map((r) => (
            <div key={r.id} className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{r.title}</p>
                <Badge
                  className={`border-0 text-[10px] px-2 py-0.5 ${
                    r.priority === 'high'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'
                      : r.priority === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {r.priority.toUpperCase()}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{r.reason}</p>
              <p className="mt-1 text-xs text-indigo-700 dark:text-indigo-300">Action: {r.suggested_action}</p>
            </div>
          ))}
          {!recommendations?.recommendations?.length && (
            <p className="text-xs text-slate-500 dark:text-slate-400">No recommendations available.</p>
          )}
        </div>
      </ChartCard>

      {/* ── Band 2 — KPI detail grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Signal latency */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 h-36 flex flex-col justify-between hover:shadow-md hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
              Signal → Action
            </span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {fmtMs(m?.signal_to_first_action.median_ms ?? null)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              p95 {fmtMs(m?.signal_to_first_action.p95_ms ?? null)} · {m?.signal_to_first_action.sample_count ?? 0} pairs
            </p>
          </div>
          <StatusPill status={m?.signal_to_first_action.status ?? 'needs_review'} />
        </div>

        {/* Quote conversion time */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 h-36 flex flex-col justify-between hover:shadow-md hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
              Quote→Invoice Time
            </span>
            <TrendingUp className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {m?.quote_to_invoice_conversion.median_hours != null
                ? `${m.quote_to_invoice_conversion.median_hours.toFixed(1)} hrs`
                : '—'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {m?.quote_to_invoice_conversion.conversions_in_window ?? 0} conversions in window
            </p>
          </div>
          <StatusPill status={m?.quote_to_invoice_conversion.status ?? 'needs_review'} />
        </div>

        {/* Automation failure rate */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 h-36 flex flex-col justify-between hover:shadow-md hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
              Automation Failures
            </span>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {fmtPct(m?.automation_reliability.failure_rate_pct ?? null)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {m?.automation_reliability.failed_runs ?? 0} failed of {m?.automation_reliability.total_runs ?? 0} runs
            </p>
          </div>
          <StatusPill status={m?.automation_reliability.status ?? 'needs_review'} />
        </div>

        {/* SDR runs */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 h-36 flex flex-col justify-between hover:shadow-md hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
              SDR Sequence Runs
            </span>
            <ListOrdered className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {m?.sdr_sequence_runs.total_runs ?? 0}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              In last {windowDays} days
            </p>
          </div>
          <StatusPill status={m?.sdr_sequence_runs.status ?? 'inactive'} />
        </div>

        {/* Sequence enrollment conversion */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 h-36 flex flex-col justify-between hover:shadow-md hover:-translate-y-[1px] transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 tracking-wide">
              Enrollment → Reply
            </span>
            <MessageSquare className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
              {fmtPct(m?.sequence_enrollment_conversion.conversion_rate_pct ?? null)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {m?.sequence_enrollment_conversion.positive_replies ?? 0} positive of{' '}
              {m?.sequence_enrollment_conversion.total_enrollments ?? 0} enrolled
            </p>
          </div>
          <StatusPill status={m?.sequence_enrollment_conversion.status ?? 'needs_review'} />
        </div>
      </div>

      {/* ── Band 3 — Charts ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <ChartCard
          title="Automation & SDR Runs"
          subtitle={`Runs and failures in last ${windowDays} days`}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={reliabilityChart} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => [v.toLocaleString(), 'Count']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {reliabilityChart.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Unibox & AI Calls"
          subtitle={`Conversations ingested, resolved, and AI-handled in last ${windowDays} days`}
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={conversionChart} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
                formatter={(v: number) => [v.toLocaleString(), 'Count']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {conversionChart.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Band 4 — Deal funnel + scorecard summary ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Deal funnel mini-chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Deal Funnel & CPQ Conversions"
            subtitle={`Deals updated, won, and quotes converted in last ${windowDays} days`}
          >
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={funnelChart} barSize={44}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v: number) => [v.toLocaleString(), 'Count']}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {funnelChart.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Status summary card */}
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm px-5 py-4 flex flex-col gap-3">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Scorecard Summary</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Last refreshed: {data ? new Date(data.generated_at).toLocaleTimeString() : '—'} ·{' '}
            {windowDays}-day window
          </p>
          <div className="space-y-2 mt-1">
            {m &&
              [
                { key: 'signal_to_first_action', label: 'Signal Latency', icon: <Clock className="w-3.5 h-3.5" /> },
                { key: 'deal_stage_velocity', label: 'Win Rate', icon: <Target className="w-3.5 h-3.5" /> },
                { key: 'quote_to_invoice_conversion', label: 'CPQ→Invoice', icon: <TrendingUp className="w-3.5 h-3.5" /> },
                { key: 'automation_reliability', label: 'Automation', icon: <Zap className="w-3.5 h-3.5" /> },
                { key: 'unibox_sla', label: 'Unibox SLA', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                { key: 'ai_suggestion_acceptance', label: 'AI Acceptance', icon: <Bot className="w-3.5 h-3.5" /> },
                { key: 'sdr_sequence_runs', label: 'SDR Runs', icon: <ListOrdered className="w-3.5 h-3.5" /> },
                { key: 'sequence_enrollment_conversion', label: 'Enrollment→Reply', icon: <MessageSquare className="w-3.5 h-3.5" /> },
              ].map(({ key, label, icon }) => {
                const metric = m[key as keyof typeof m] as { status: KpiStatus }
                return (
                  <div key={key} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      {icon}
                      {label}
                    </span>
                    <StatusPill status={metric.status} />
                  </div>
                )
              })}
          </div>
        </div>
      </div>

      {/* ── Footer metadata ─────────────────────────────────────────────────── */}
      {data && (
        <p className="text-[11px] text-slate-400 dark:text-slate-600 text-right">
          Schema v{data.schema_version} · Window since {new Date(data.since).toLocaleDateString()} ·
          Generated {new Date(data.generated_at).toLocaleString()}
        </p>
      )}
    </div>
  )
}
