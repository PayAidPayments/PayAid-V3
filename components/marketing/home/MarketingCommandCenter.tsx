'use client'

/**
 * Marketing Command Center — Phase A (investor-demo grade)
 *
 * Sections:
 *   A. Executive KPI strip  — real from /api/marketing/dashboard/enriched + /analytics
 *   B. Campaign performance — real topCampaigns + monthlyTrend charts
 *   C. Publishing workflow  — MOCKED (MarketingPost model may not be in client)
 *   D. Channel intelligence — real channelBreakdownPct + byType breakdown
 *   E. AI recommendations   — evidence-backed derivations from real data
 *   F. Activity feed        — real campaigns sorted by createdAt
 */

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Minus,
  Megaphone, Mail, MessageCircle, Smartphone,
  PenLine, Clock, CheckCircle2, Send, AlertCircle, XCircle,
  Sparkles, ArrowRight, Users, BarChart3, Target, Zap,
  Globe, Calendar, Activity, Reply,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { EnrichedData, AnalyticsData, CampaignRow, CommandCenterData } from '@/lib/marketing/marketing-home-types'
import { parseUnifiedInboxItemId } from '@/lib/marketing/inbox-reply'
import {
  ModuleDashboardShell,
  DashboardEmptyState,
  type DashboardKpi,
  type DashboardAction,
} from '@/components/modules/dashboard'

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | undefined | null) {
  if (n == null) return '—'
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(1)}Cr`
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
  return `₹${n.toLocaleString()}`
}

function fmtNum(n: number | undefined | null) {
  if (n == null) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return n.toLocaleString()
}

function pct(n: number) { return `${n.toFixed(1)}%` }

function Delta({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const positive = inverse ? value < 0 : value > 0
  const zero = value === 0
  if (zero) return <span className="inline-flex items-center gap-0.5 text-slate-400 text-xs"><Minus className="w-3 h-3" />0%</span>
  return (
    <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {Math.abs(value)}%
    </span>
  )
}

function ChannelIcon({ type }: { type: string }) {
  const t = type.toLowerCase()
  if (t === 'email') return <Mail className="w-3.5 h-3.5 text-sky-500" />
  if (t === 'whatsapp') return <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
  if (t === 'sms') return <Smartphone className="w-3.5 h-3.5 text-violet-500" />
  return <Globe className="w-3.5 h-3.5 text-slate-400" />
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase()
  const cfg: Record<string, string> = {
    sent: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    sending: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
    scheduled: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
    draft: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    failed: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
  }
  return (
    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide', cfg[s] ?? cfg.draft)}>
      {status}
    </span>
  )
}

function SectionCard({ title, subtitle, action, children, className }: {
  title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <div className={cn('rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </div>
  )
}

function EmptyState({ icon: Icon, title, desc, cta, href }: {
  icon: React.ElementType; title: string; desc: string; cta?: string; href?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{title}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">{desc}</p>
      </div>
      {cta && href && (
        <Link href={href} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors">
          {cta} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  )
}

// ─── Section A: KPI Strip ────────────────────────────────────────────────────

function KpiStrip({
  enriched,
  analytics,
}: { enriched: EnrichedData | null; analytics: AnalyticsData | null }) {
  const overview = analytics?.overview

  const kpis = [
    {
      label: 'Attributed Revenue',
      value: fmt(enriched?.marketingRevenue),
      delta: enriched?.revenueGrowth ?? 0,
      sub: enriched?.last30dRevenue ? `${fmt(enriched.last30dRevenue)} last 30d` : 'From won deals',
      icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
      color: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      label: 'Marketing Spend',
      value: fmt(enriched?.marketingSpend),
      delta: 0,
      sub: enriched?.spendIsEstimated ? 'Estimated until spend tracked' : 'From campaign spend',
      icon: <Activity className="w-4 h-4 text-rose-500" />,
      color: 'text-rose-600 dark:text-rose-400',
      note: enriched?.spendIsEstimated ? 'est' : undefined,
    },
    {
      label: 'Leads Generated',
      value: fmtNum(enriched?.leadsGenerated),
      delta: 0,
      sub: `${fmtNum(enriched?.funnelData.deals)} won deals`,
      icon: <Target className="w-4 h-4 text-violet-500" />,
      color: 'text-violet-600 dark:text-violet-400',
    },
    {
      label: 'Open Rate',
      value: overview ? pct(overview.openRate) : '—',
      delta: 0,
      sub: overview ? `${pct(overview.clickRate)} CTR` : 'No sends yet',
      icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
      color: 'text-amber-600 dark:text-amber-500',
    },
    {
      label: 'Qualified Leads',
      value: fmtNum(enriched?.qualifiedLeads),
      delta: 0,
      sub: enriched?.qualifiedLeads30d
        ? `${fmtNum(enriched.qualifiedLeads30d)} last 30d`
        : 'Score ≥50 or hot nurture',
      icon: <Users className="w-4 h-4 text-sky-500" />,
      color: 'text-sky-600 dark:text-sky-400',
    },
    {
      label: 'Conversion Rate',
      value: enriched ? pct(enriched.conversionRate) : '—',
      delta: 0,
      sub: overview ? `${pct(overview.clickThroughRate)} CTO` : 'Clicks / delivered',
      icon: <Zap className="w-4 h-4 text-orange-500" />,
      color: 'text-orange-600 dark:text-orange-400',
    },
    {
      label: 'ROAS',
      value: enriched?.roas ? `${enriched.roas}x` : '—',
      delta: 0,
      sub: enriched?.marketingSpend ? `${fmt(enriched.marketingSpend)} spend` : 'Revenue / spend',
      icon: <TrendingUp className="w-4 h-4 text-emerald-500" />,
      color: 'text-emerald-600 dark:text-emerald-400',
      note: enriched?.spendIsEstimated ? 'est' : undefined,
    },
    {
      label: 'Campaigns',
      value: fmtNum(overview?.totalCampaigns),
      delta: 0,
      sub:
        (overview?.totalCampaigns ?? 0) > 0
          ? `${enriched?.campaignHealth.optimalPct ?? 0}% healthy`
          : 'No campaigns yet',
      icon: <Megaphone className="w-4 h-4 text-indigo-500" />,
      color: 'text-indigo-600 dark:text-indigo-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
      {kpis.map((k) => (
        <div
          key={k.label}
          className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm px-4 py-3.5 flex flex-col justify-between min-h-[5.5rem] hover:shadow-md hover:-translate-y-px transition-all duration-150"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate pr-1">
              {k.label}
            </span>
            {k.icon}
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className={cn('text-xl font-bold tabular-nums leading-tight', k.color)}>{k.value}</span>
              {k.note && <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded-full">{k.note}</span>}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{k.sub}</span>
              {k.delta !== 0 && <Delta value={k.delta} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Section B: Campaign Performance ────────────────────────────────────────

function CampaignPerformance({
  tenantId,
  analytics,
  campaigns,
}: { tenantId: string; analytics: AnalyticsData | null; campaigns: CampaignRow[] }) {
  const [metric, setMetric] = useState<'sent' | 'opened' | 'clicked'>('opened')
  const trend = analytics?.monthlyTrend ?? []
  const top = analytics?.topCampaigns ?? []
  const recent = campaigns.slice(0, 8)

  const metricLabels = { sent: 'Sent', opened: 'Opened', clicked: 'Clicked' }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
      {/* Chart */}
      <SectionCard
        className="xl:col-span-3"
        title="Campaign Trend"
        subtitle="6-month volume by month"
        action={
          <div className="flex gap-1">
            {(Object.keys(metricLabels) as Array<keyof typeof metricLabels>).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors',
                  metric === m
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                )}
              >
                {metricLabels[m]}
              </button>
            ))}
          </div>
        }
      >
        {trend.length === 0 || trend.every((t) => t[metric] === 0) ? (
          <EmptyState icon={BarChart3} title="No campaign data yet" desc="Send your first campaign to see trend charts." cta="Create campaign" href={`/marketing/${tenantId}/Studio`} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="mcGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.6} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                cursor={{ stroke: '#7c3aed', strokeWidth: 1, strokeDasharray: '4 2' }}
              />
              <Area type="monotone" dataKey={metric} stroke="#7c3aed" strokeWidth={2} fill="url(#mcGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </SectionCard>

      {/* Top campaigns table */}
      <SectionCard
        className="xl:col-span-2"
        title="Top Campaigns"
        subtitle="By open rate"
        action={
          <Link href={`/marketing/${tenantId}/History`} className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
            View all
          </Link>
        }
      >
        {top.length === 0 ? (
          <EmptyState icon={Megaphone} title="No sent campaigns" desc="Send a campaign to see performance rankings." />
        ) : (
          <div className="space-y-2">
            {top.slice(0, 5).map((c, i) => (
              <Link
                key={c.id}
                href={`/marketing/${tenantId}/Campaigns/${c.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <span className="text-xs font-bold text-slate-300 dark:text-slate-600 w-4 shrink-0 tabular-nums">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{c.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <ChannelIcon type={c.type} />
                    <span className="text-[10px] text-slate-400">{fmtNum(c.sent)} sent</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold tabular-nums text-slate-900 dark:text-slate-50">{pct(c.openRate)}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Open</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Recent campaigns full-width table */}
      <div className="xl:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Recent Campaigns</h2>
            <p className="text-xs text-slate-400 mt-0.5">All channels · latest 8</p>
          </div>
          <Link href={`/marketing/${tenantId}/History`} className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline">
            Full history
          </Link>
        </div>
        {recent.length === 0 ? (
          <EmptyState icon={Megaphone} title="No campaigns yet" desc="Create your first email, WhatsApp, or SMS campaign." cta="New campaign" href={`/marketing/${tenantId}/Studio`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {['Campaign', 'Channel', 'Status', 'Sent', 'Delivered', 'Open rate', 'CTR', 'Date'].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {recent.map((c) => {
                  const openRate = c.analytics?.openRate ?? 0
                  const ctr = c.analytics?.clickRate ?? 0
                  const isGoodOpen = openRate >= 20
                  const isLowOpen = openRate > 0 && openRate < 10
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/marketing/${tenantId}/Campaigns/${c.id}`} className="font-medium text-slate-800 dark:text-slate-200 hover:text-violet-600 dark:hover:text-violet-400 max-w-[180px] truncate block">
                          {c.name}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5"><ChannelIcon type={c.type} />{c.type}</span>
                      </td>
                      <td className="px-4 py-3"><StatusPill status={c.status} /></td>
                      <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">{fmtNum(c.sent)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">{fmtNum(c.delivered)}</td>
                      <td className="px-4 py-3">
                        {c.analytics ? (
                          <span className={cn('font-medium tabular-nums', isGoodOpen ? 'text-emerald-600 dark:text-emerald-400' : isLowOpen ? 'text-red-500 dark:text-red-400' : 'text-slate-700 dark:text-slate-300')}>
                            {pct(openRate)}
                          </span>
                        ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                        {c.analytics ? pct(ctr) : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section C: Publishing Workflow ─────────────────────────────────────────
// MOCKED: MarketingPost model availability is uncertain; show instructive placeholders

function PublishingWorkflow({ tenantId, commandCenter }: { tenantId: string; commandCenter: CommandCenterData | null }) {
  const publishing = commandCenter?.publishing
  const statuses = [
    { label: 'Drafts', count: publishing?.drafts ?? 0, icon: PenLine, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-800' },
    { label: 'Scheduled', count: publishing?.scheduled ?? 0, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
    { label: 'Awaiting Approval', count: publishing?.awaitingApproval ?? 0, icon: AlertCircle, color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/30' },
    { label: 'Published Today', count: publishing?.publishedToday ?? 0, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
    { label: 'Failed', count: publishing?.failed ?? 0, icon: XCircle, color: 'text-red-500 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30' },
  ]

  const actions = [
    { label: 'Compose', href: `${tenantId}/Studio`, icon: PenLine },
    { label: 'Schedule', href: `${tenantId}/Studio`, icon: Calendar },
    { label: 'History', href: `${tenantId}/History`, icon: Activity },
    { label: 'Channels', href: `${tenantId}/Social-Media`, icon: Globe },
  ]

  return (
    <SectionCard
      title="Publishing Workflow"
      subtitle="Content pipeline status"
      action={
        commandCenter ? (
          <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
            SocialPost + MarketingPost
          </span>
        ) : (
          <span className="text-[9px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide">
            Data unavailable
          </span>
        )
      }
    >
      <div className="grid grid-cols-5 gap-2 mb-4">
        {statuses.map((s) => (
          <div key={s.label} className={cn('rounded-xl p-3 text-center', s.bg)}>
            <s.icon className={cn('w-4 h-4 mx-auto mb-1', s.color)} />
            <p className={cn('text-xl font-bold tabular-nums leading-tight', s.color)}>{s.count}</p>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Link
            key={a.label}
            href={`/marketing/${a.href}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-violet-300 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            <a.icon className="w-3.5 h-3.5" />
            {a.label}
          </Link>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Section D: Channel Intelligence ────────────────────────────────────────

function ChannelIntelligence({ enriched, analytics }: { enriched: EnrichedData | null; analytics: AnalyticsData | null }) {
  const byType = analytics?.byType
  const channelPct = enriched?.channelBreakdownPct

  const channels = [
    {
      name: 'Email',
      type: 'email',
      pct: channelPct?.email ?? 0,
      openRate: byType?.email.openRate ?? 0,
      clickRate: byType?.email.clickRate ?? 0,
      count: byType?.email.count ?? 0,
      color: '#0ea5e9',
      bg: 'bg-sky-500',
    },
    {
      name: 'WhatsApp',
      type: 'whatsapp',
      pct: channelPct?.whatsapp ?? 0,
      openRate: byType?.whatsapp.openRate ?? 0,
      clickRate: byType?.whatsapp.clickRate ?? 0,
      count: byType?.whatsapp.count ?? 0,
      color: '#10b981',
      bg: 'bg-emerald-500',
    },
    {
      name: 'SMS',
      type: 'sms',
      pct: 0,
      openRate: 0,
      clickRate: byType?.sms.clickRate ?? 0,
      count: byType?.sms.count ?? 0,
      color: '#7c3aed',
      bg: 'bg-violet-500',
    },
  ]

  const hasData = channels.some((c) => c.count > 0)

  const barData = analytics?.byType
    ? [
        { channel: 'Email', sent: byType?.email.sent ?? 0, opened: byType?.email.opened ?? 0, clicked: byType?.email.clicked ?? 0 },
        { channel: 'WhatsApp', sent: byType?.whatsapp.sent ?? 0, opened: byType?.whatsapp.opened ?? 0, clicked: byType?.whatsapp.clicked ?? 0 },
        { channel: 'SMS', sent: byType?.sms.sent ?? 0, opened: 0, clicked: byType?.sms.clicked ?? 0 },
      ]
    : []

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      {/* Channel breakdown */}
      <SectionCard title="Channel Mix" subtitle="Share of total outreach by channel">
        {!hasData ? (
          <EmptyState icon={Globe} title="No channel data yet" desc="Channel breakdown appears once campaigns are sent." />
        ) : (
          <div className="space-y-4">
            {channels.map((c) => (
              <div key={c.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <ChannelIcon type={c.type} />{c.name}
                  </span>
                  <span className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                    <span className="tabular-nums">{c.count} campaigns</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{c.pct}%</span>
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-500', c.bg)} style={{ width: `${Math.min(c.pct, 100)}%` }} />
                </div>
                <div className="flex gap-4 text-[10px] text-slate-400">
                  <span>Open: <span className="font-medium text-slate-600 dark:text-slate-300">{pct(c.openRate)}</span></span>
                  <span>CTR: <span className="font-medium text-slate-600 dark:text-slate-300">{pct(c.clickRate)}</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Channel volume chart */}
      <SectionCard title="Volume by Channel" subtitle="Sent, opened, clicked">
        {barData.every((d) => d.sent === 0) ? (
          <EmptyState icon={BarChart3} title="No data" desc="Channel volume appears after campaigns are sent." />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
              <XAxis dataKey="channel" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="sent" name="Sent" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
              <Bar dataKey="opened" name="Opened" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              <Bar dataKey="clicked" name="Clicked" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </SectionCard>
    </div>
  )
}

// ─── Section E: AI Recommendations ──────────────────────────────────────────

interface Recommendation {
  id: string
  title: string
  why: string
  impact: 'high' | 'medium' | 'low'
  confidence: number
  action: string
  actionHref: string
  category: string
}

function deriveRecommendations(enriched: EnrichedData | null, analytics: AnalyticsData | null): Recommendation[] {
  const recs: Recommendation[] = []
  const overview = analytics?.overview
  const byType = analytics?.byType

  if (!overview || !enriched) {
    return [{
      id: 'no-data',
      title: 'Connect your first campaign channel',
      why: 'No campaign data found. AI recommendations need at least one sent campaign to analyse.',
      impact: 'high',
      confidence: 100,
      action: 'Create campaign',
      actionHref: 'Studio',
      category: 'Setup',
    }]
  }

  // Low open rate signal
  if (overview.openRate > 0 && overview.openRate < 15) {
    recs.push({
      id: 'low-open',
      title: 'Open rate is below industry average (15%)',
      why: `Your overall open rate is ${overview.openRate.toFixed(1)}%. Common causes: subject line weak, sending at wrong time, or list hygiene issues.`,
      impact: 'high',
      confidence: 88,
      action: 'Review subject lines',
      actionHref: 'History',
      category: 'Engagement',
    })
  }

  // WhatsApp vs Email CTR
  const waClickRate = byType?.whatsapp.clickRate ?? 0
  const emailClickRate = byType?.email.clickRate ?? 0
  if (waClickRate > 0 && emailClickRate > 0 && waClickRate > emailClickRate * 1.15) {
    const diff = Math.round(((waClickRate - emailClickRate) / emailClickRate) * 100)
    recs.push({
      id: 'wa-vs-email',
      title: `WhatsApp CTR is ${diff}% higher than Email`,
      why: `WhatsApp: ${pct(waClickRate)} vs Email: ${pct(emailClickRate)}. Shift more top-of-funnel content to WhatsApp for better engagement.`,
      impact: 'high',
      confidence: 91,
      action: 'Create WhatsApp campaign',
      actionHref: 'Studio',
      category: 'Channel Mix',
    })
  }

  // High bounce rate
  if (overview.bounceRate > 5) {
    recs.push({
      id: 'high-bounce',
      title: `Bounce rate at ${overview.bounceRate.toFixed(1)}% — list needs cleaning`,
      why: `Anything above 2% can damage sender reputation. ${fmtNum(overview.totalBounced)} hard bounces detected.`,
      impact: 'high',
      confidence: 95,
      action: 'Clean segments',
      actionHref: 'Segments',
      category: 'Deliverability',
    })
  }

  // Underperforming campaigns
  if (enriched.campaignHealth.failing > 0) {
    recs.push({
      id: 'failing-campaigns',
      title: `${enriched.campaignHealth.failing} campaign${enriched.campaignHealth.failing > 1 ? 's' : ''} with <10% open rate`,
      why: `${enriched.campaignHealth.failingPct}% of your sent campaigns are underperforming. Review content, targeting, or timing.`,
      impact: 'medium',
      confidence: 82,
      action: 'View campaigns',
      actionHref: 'History',
      category: 'Campaign Health',
    })
  }

  // Unsubscribe rate
  if (overview.unsubscribeRate > 1) {
    recs.push({
      id: 'unsub',
      title: `Unsubscribe rate at ${overview.unsubscribeRate.toFixed(2)}%`,
      why: 'High unsubscribes suggest content–audience mismatch. Consider segmenting by engagement before the next blast.',
      impact: 'medium',
      confidence: 78,
      action: 'Review segments',
      actionHref: 'Segments',
      category: 'Retention',
    })
  }

  // Revenue available but low ROAS
  if (enriched.marketingSpend > 0 && enriched.roas > 0 && enriched.roas < 2) {
    recs.push({
      id: 'low-roas',
      title: 'ROAS under 2x — optimise spend allocation',
      why: `ROAS is ${enriched.roas}x on ${enriched.spendIsEstimated ? 'estimated' : 'tracked'} spend of ₹${Math.round(enriched.marketingSpend).toLocaleString('en-IN')}. Review which campaigns generate pipeline.`,
      impact: 'medium',
      confidence: enriched.spendIsEstimated ? 65 : 82,
      action: 'View analytics',
      actionHref: 'Analytics',
      category: 'Revenue',
    })
  } else if (enriched.roi > 0 && enriched.roi < 2 && enriched.marketingSpend === 0) {
    recs.push({
      id: 'low-roi',
      title: 'ROI under 2x — track campaign spend for ROAS',
      why: `Estimated ROI is ${enriched.roi}x. Add spend on campaign detail pages to unlock accurate ROAS.`,
      impact: 'medium',
      confidence: 65,
      action: 'View campaigns',
      actionHref: 'History',
      category: 'Revenue',
    })
  }

  // No campaigns sent yet
  if (overview.totalCampaigns === 0) {
    recs.push({
      id: 'no-campaigns',
      title: 'No campaigns sent yet',
      why: 'Your marketing pipeline is empty. Start with a WhatsApp campaign to your most engaged contact segment.',
      impact: 'high',
      confidence: 100,
      action: 'Create first campaign',
      actionHref: 'Studio',
      category: 'Setup',
    })
  }

  // Good open rate — praise + scale
  if (overview.openRate >= 25 && overview.totalCampaigns >= 3) {
    recs.push({
      id: 'good-open',
      title: `Strong open rate at ${pct(overview.openRate)} — scale winning campaigns`,
      why: 'You are above the 25% benchmark. Consider increasing frequency or expanding the audience on your top 3 campaigns.',
      impact: 'medium',
      confidence: 87,
      action: 'Top campaigns',
      actionHref: 'Analytics',
      category: 'Scale',
    })
  }

  return recs.slice(0, 5)
}

const impactConfig = {
  high: { label: 'High impact', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
  medium: { label: 'Medium', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  low: { label: 'Low', color: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' },
}

function AIRecommendations({
  tenantId,
  enriched,
  analytics,
}: { tenantId: string; enriched: EnrichedData | null; analytics: AnalyticsData | null }) {
  const recs = useMemo(() => deriveRecommendations(enriched, analytics), [enriched, analytics])

  return (
    <SectionCard
      title="AI Recommendations"
      subtitle="Evidence-backed, derived from your campaign data"
      action={
        <div className="flex items-center gap-1.5 text-[10px] text-violet-500 dark:text-violet-400 font-medium">
          <Sparkles className="w-3 h-3" /> AI
        </div>
      }
    >
      <div className="space-y-3">
        {recs.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 px-4 py-3 flex gap-3 items-start">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={cn('px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide', impactConfig[r.impact].color)}>
                  {impactConfig[r.impact].label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  {r.category}
                </span>
                <span className="text-[9px] text-slate-400">{r.confidence}% confidence</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{r.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{r.why}</p>
            </div>
            <Link
              href={`/marketing/${tenantId}/${r.actionHref}`}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-semibold transition-colors whitespace-nowrap"
            >
              {r.action} <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ─── Section F: Activity Feed ────────────────────────────────────────────────

function ActivityFeed({ tenantId, campaigns }: { tenantId: string; campaigns: CampaignRow[] }) {
  const items = [...campaigns]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <SectionCard title="Recent Activity" subtitle="Campaign launches and updates">
      {items.length === 0 ? (
        <EmptyState icon={Activity} title="No activity yet" desc="Your campaign history will appear here." />
      ) : (
        <div className="space-y-2">
          {items.map((c) => {
            const date = new Date(c.createdAt)
            const label = c.sentAt ? 'Sent' : c.scheduledFor ? 'Scheduled' : 'Created'
            const icon = c.sentAt ? <Send className="w-3.5 h-3.5 text-emerald-500" /> : c.scheduledFor ? <Clock className="w-3.5 h-3.5 text-amber-500" /> : <PenLine className="w-3.5 h-3.5 text-slate-400" />
            return (
              <Link
                key={c.id}
                href={`/marketing/${tenantId}/Campaigns/${c.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-2.5 -mx-2 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  {icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">{c.name}</p>
                  <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <ChannelIcon type={c.type} />
                    <span>{label}</span>
                    {c.analytics && <span>· {fmtNum(c.sent)} sent · {pct(c.analytics.openRate)} open</span>}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <StatusPill status={c.status} />
                  <p className="text-[9px] text-slate-400 mt-1">
                    {date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Section G: Calendar / milestones ────────────────────────────────────────

function MarketingCalendar({ tenantId, commandCenter }: { tenantId: string; commandCenter: CommandCenterData | null }) {
  const items = commandCenter?.calendar ?? []
  const kindLabel: Record<string, string> = {
    scheduled_post: 'Scheduled',
    marketing_post: 'Studio',
    campaign: 'Campaign',
    launch: 'Launch',
  }

  return (
    <SectionCard
      title="Calendar & Milestones"
      subtitle="Next 14 days — posts, campaigns, launches"
      action={
        <Link href={`/marketing/${tenantId}/Studio`} className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
          Schedule
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Nothing scheduled yet"
          desc="Schedule a post or campaign to see your marketing calendar populate."
          cta="Open Studio"
          href={`/marketing/${tenantId}/Studio`}
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const at = new Date(item.at)
            const isPast = at.getTime() < Date.now()
            return (
              <div
                key={`${item.kind}-${item.id}`}
                className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="w-12 shrink-0 text-center">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{at.toLocaleDateString('en-IN', { month: 'short' })}</p>
                  <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-200 leading-none">{at.getDate()}</p>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <ChannelIcon type={item.channel} />
                    <span>{kindLabel[item.kind] || item.kind}</span>
                    <span>·</span>
                    <span>{at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </p>
                </div>
                <StatusPill status={isPast ? 'sent' : item.status} />
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Section H: Best time to post ────────────────────────────────────────────

function BestTimeToPost({ commandCenter }: { commandCenter: CommandCenterData | null }) {
  const slots = commandCenter?.bestTimeToPost ?? []
  return (
    <SectionCard
      title="Best Time to Post"
      subtitle="Top slots from last 90 days of published social posts"
    >
      {slots.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Not enough post history"
          desc="Publish social posts with timestamps to unlock timing recommendations."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {slots.map((slot, i) => (
            <div
              key={`${slot.dayOfWeek}-${slot.hour}`}
              className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                #{i + 1} slot
              </p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                {slot.dayLabel} · {slot.hourLabel}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {slot.posts} post{slot.posts !== 1 ? 's' : ''} · avg {slot.avgEngagement} engagements
              </p>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Section I: Audience segments ────────────────────────────────────────────

function AudienceSegments({ tenantId, commandCenter }: { tenantId: string; commandCenter: CommandCenterData | null }) {
  const segments = commandCenter?.audienceSegments ?? []
  return (
    <SectionCard
      title="Audience Segments"
      subtitle="CRM segments available for targeting"
      action={
        <Link href={`/marketing/${tenantId}/Segments`} className="text-xs text-violet-600 dark:text-violet-400 hover:underline font-medium">
          Manage
        </Link>
      }
    >
      {segments.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No segments yet"
          desc="Create segments in CRM to power campaign targeting."
          cta="Open Segments"
          href={`/marketing/${tenantId}/Segments`}
        />
      ) : (
        <div className="space-y-2">
          {segments.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 dark:border-slate-800 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{s.name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{s.criteria}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ─── Engagement Inbox ────────────────────────────────────────────────────────

function EngagementInbox({ tenantId, commandCenter }: { tenantId: string; commandCenter: CommandCenterData | null }) {
  const router = useRouter()
  const engagement = commandCenter?.engagement
  const inbox = commandCenter?.unifiedInbox ?? []
  const [draftingId, setDraftingId] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const channels = [
    { label: 'Mentions', count: engagement?.mentions ?? 0, icon: Globe, href: 'Social-Media' },
    { label: 'Comments', count: engagement?.comments ?? 0, icon: MessageCircle, href: 'Social-Media' },
    { label: 'DMs', count: engagement?.dms ?? 0, icon: Mail, href: 'Social-Media' },
    { label: 'WhatsApp', count: engagement?.whatsapp ?? 0, icon: Smartphone, href: 'Social-Media' },
    { label: 'Email', count: engagement?.email ?? 0, icon: Mail, href: 'History' },
  ]
  const sourceBadge: Record<string, string> = {
    social: 'Social',
    whatsapp: 'WA',
    email: 'Email',
  }

  async function createReplyDraft(item: (typeof inbox)[number]) {
    setDraftingId(item.id)
    setDraftError(null)
    const { entityId } = parseUnifiedInboxItemId(item.id)
    try {
      const res = await fetch('/api/marketing/home/inbox-reply-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inboxItemId: item.id,
          source: item.source,
          channel: item.channel,
          entityId,
          actorName: item.actorName,
          preview: item.preview,
          action: item.action,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error((data as { error?: string }).error || 'Failed to create draft')
      }
      const href = (data as { studioHref?: string }).studioHref || item.replyHref
      router.push(href)
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'Draft failed')
      setDraftingId(null)
    }
  }

  return (
    <SectionCard
      title="Unified Engagement Inbox"
      subtitle="Last 7 days — social webhooks, WhatsApp inbound, email inbox"
      action={
        <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-semibold">
          Multi-channel
        </span>
      }
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {channels.map((c) => (
          <Link key={c.label} href={`/marketing/${tenantId}/${c.href}`} className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-3 hover:border-violet-300 dark:hover:border-violet-700 transition-colors group text-center">
            <c.icon className="w-4 h-4 mx-auto mb-1.5 text-slate-400 group-hover:text-violet-500 transition-colors" />
            <p className={cn('text-xl font-bold tabular-nums', c.count > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-300 dark:text-slate-600')}>{c.count}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{c.label}</p>
          </Link>
        ))}
      </div>
      {inbox.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Recent across channels</p>
          {inbox.slice(0, 6).map((item) => (
            <div key={item.id} className="flex items-start gap-2 text-xs group">
              <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-[9px] font-semibold uppercase">
                {sourceBadge[item.source] ?? item.source}
              </span>
              <span className="shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 text-[9px] font-semibold uppercase">
                {item.action}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-slate-700 dark:text-slate-300 truncate">
                  {item.actorName || item.channel}
                  {item.requiresResponse && (
                    <span className="ml-1.5 text-[9px] text-amber-600 dark:text-amber-400">needs reply</span>
                  )}
                </p>
                {item.preview && <p className="text-[10px] text-slate-400 truncate">{item.preview}</p>}
              </div>
              {item.requiresResponse && (
                <button
                  type="button"
                  onClick={() => createReplyDraft(item)}
                  disabled={draftingId === item.id}
                  className="shrink-0 inline-flex items-center gap-1 rounded-lg border border-violet-200 dark:border-violet-800 px-2 py-1 text-[10px] font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 disabled:opacity-50"
                >
                  <Reply className="w-3 h-3" />
                  {draftingId === item.id ? 'Drafting…' : 'Draft reply'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {draftError && <p className="text-[10px] text-red-500 mt-2">{draftError}</p>}
      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-3 leading-relaxed">
        Social events from webhooks; WhatsApp and email from connected accounts.
        <Link href={`/marketing/${tenantId}/Social-Media`} className="text-violet-500 hover:underline ml-1">Set up channels →</Link>
      </p>
    </SectionCard>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MarketingCommandCenter({
  tenantId,
  enriched,
  analytics,
  campaigns,
  commandCenter,
}: {
  tenantId: string
  enriched: EnrichedData | null
  analytics: AnalyticsData | null
  campaigns: CampaignRow[]
  commandCenter: CommandCenterData | null
}) {
  const hasAnyCampaignData = (analytics?.overview.totalCampaigns ?? 0) > 0
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  const router = useRouter()
  const [seeding, setSeeding] = useState(false)
  const [seedError, setSeedError] = useState<string | null>(null)

  async function seedDemoData() {
    setSeeding(true)
    setSeedError(null)
    try {
      const res = await fetch('/api/marketing/demo/seed', {
        method: 'POST',
        headers: { 'x-demo-seed': '1' },
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        setSeedError(body?.error || 'Demo seed failed')
        return
      }
      router.refresh()
    } catch {
      setSeedError('Demo seed failed')
    } finally {
      setSeeding(false)
    }
  }

  const overview = analytics?.overview
  const shellKpis: DashboardKpi[] = [
    {
      label: 'Attributed revenue',
      value: fmt(enriched?.marketingRevenue),
      change: enriched?.revenueGrowth,
      trend: (enriched?.revenueGrowth || 0) >= 0 ? 'up' : 'down',
      tone: 'success',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      label: 'Leads generated',
      value: fmtNum(enriched?.leadsGenerated),
      tone: 'purple',
      icon: <Target className="w-5 h-5" />,
    },
    {
      label: 'Open rate',
      value: overview ? pct(overview.openRate) : '—',
      tone: 'gold',
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: 'Campaigns',
      value: fmtNum(overview?.totalCampaigns),
      tone: 'info',
      icon: <Megaphone className="w-5 h-5" />,
      href: `/marketing/${tenantId}/Campaigns`,
    },
  ]

  const shellActions: DashboardAction[] = [
    {
      label: 'Compose',
      href: `/marketing/${tenantId}/Studio`,
      icon: <PenLine className="w-4 h-4" />,
    },
    {
      label: 'Campaigns',
      href: `/marketing/${tenantId}/Campaigns`,
      variant: 'secondary',
    },
    {
      label: 'Analytics',
      href: `/marketing/${tenantId}/Analytics`,
      icon: <BarChart3 className="w-4 h-4" />,
      variant: 'secondary',
    },
    {
      label: 'Segments',
      href: `/marketing/${tenantId}/Segments`,
      variant: 'secondary',
    },
  ]

  const insightText = hasAnyCampaignData
    ? `Marketing attributed ${fmt(enriched?.marketingRevenue)} with ${fmtNum(overview?.totalCampaigns)} campaigns. Open rate ${overview ? pct(overview.openRate) : '—'}.`
    : 'Your Marketing Command Center is ready. Send a campaign or seed demo data to unlock live KPIs.'

  return (
    <ModuleDashboardShell
      moduleId="marketing"
      title="Marketing"
      subtitle={today}
      kpis={shellKpis}
      insight={{
        text: insightText,
        status: hasAnyCampaignData ? 'ready' : 'unavailable',
        href: `/marketing/${tenantId}/Analytics`,
        hrefLabel: 'More insights',
      }}
      actions={shellActions}
      secondaryTitle="Campaign performance"
      secondaryDescription="Primary campaign trend — channel and calendar detail live under Analytics / Studio"
      secondary={
        hasAnyCampaignData ? (
          <CampaignPerformance tenantId={tenantId} analytics={analytics} campaigns={campaigns} />
        ) : (
          <div className="space-y-4">
            <DashboardEmptyState
              icon={<Sparkles />}
              title="No campaigns yet"
              description="Send your first campaign to unlock AI recommendations and channel intelligence."
              actionLabel="Launch first campaign"
              actionHref={`/marketing/${tenantId}/Studio`}
            />
            <div className="flex flex-wrap items-center justify-center gap-2 pb-2">
              <button
                type="button"
                onClick={seedDemoData}
                disabled={seeding}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-60"
              >
                {seeding ? 'Seeding…' : 'Seed demo data'}
              </button>
              {seedError ? <p className="text-xs text-red-500 w-full text-center">{seedError}</p> : null}
            </div>
          </div>
        )
      }
    />
  )
}
