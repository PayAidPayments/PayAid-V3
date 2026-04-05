'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  Users,
  IndianRupee,
  BarChart3,
  Share2,
  Mail,
  GitBranch,
  Video,
  Lightbulb,
  Plus,
  Sparkles,
  MessageCircle,
  Target,
  LayoutGrid,
  Bot,
  Zap,
  Rocket,
  FileText,
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface EnrichedData {
  marketingRevenue: number
  last30dRevenue: number
  revenueGrowth: number
  avgRevenuePerMonth: number
  leadsGenerated: number
  conversionRate: number
  totalReach: number
  avgPerReach: number
  roi: number
  gstCompliantPct: number
  gstCompliantCount: number
  gstTotalInvoices: number
  channelBreakdownPct: { whatsapp: number; email: number; facebook: number; linkedin: number }
  campaignHealth: { optimalPct: number; underperformPct: number; failingPct: number }
  audience: { active: number; engaged: number; highValue: number }
  monthlyRevenue: Array<{ month: string; revenue: number }>
  channelRoi: Array<{ name: string; roi: number; revenue: number }>
  funnelData: { leads: number; meetings: number; deals: number; dealsValue: number }
}

interface InsightsData {
  insights: string[]
  source: 'ollama' | 'static'
}

const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const SUCCESS = '#059669'
const INFO = '#0284C7'
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#EC4899']

export default function MarketingDashboardPage(props: PageProps<'/marketing/[tenantId]/Home'>) {
  const { tenantId } = use(props.params)
  const { user, token } = useAuthStore()
  const [enriched, setEnriched] = useState<EnrichedData | null>(null)
  const [insights, setInsights] = useState<InsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) {
      setLoading(false)
      return
    }
    const controller = new AbortController()
    const headers: HeadersInit = { ...(token && { Authorization: `Bearer ${token}` }) }

    Promise.all([
      fetch(`/api/marketing/dashboard/enriched`, { headers, signal: controller.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Failed to load dashboard'))
      ),
      fetch(`/api/marketing/insights`, { headers, signal: controller.signal }).then((r) =>
        r.ok ? r.json() : { insights: [] as string[], source: 'static' as const }
      ),
    ])
      .then(([enrichedData, insightsData]) => {
        setEnriched(enrichedData)
        setInsights(insightsData?.insights ? insightsData : { insights: [], source: 'static' })
        setError(null)
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          setError(e?.message ?? 'Failed to load dashboard')
          setEnriched(null)
          setInsights(null)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tenantId, token])

  if (!tenantId) return <PageLoading message="Loading..." fullScreen={true} />
  if (loading) return <PageLoading message="Loading Marketing dashboard..." fullScreen={true} />

  const e = enriched ?? {
    marketingRevenue: 0,
    last30dRevenue: 0,
    revenueGrowth: 0,
    avgRevenuePerMonth: 0,
    leadsGenerated: 0,
    conversionRate: 0,
    totalReach: 0,
    avgPerReach: 0,
    roi: 0,
    gstCompliantPct: 0,
    gstCompliantCount: 0,
    gstTotalInvoices: 0,
    channelBreakdownPct: { whatsapp: 0, email: 0, facebook: 0, linkedin: 0 },
    campaignHealth: { optimalPct: 0, underperformPct: 0, failingPct: 0 },
    audience: { active: 0, engaged: 0, highValue: 0 },
    monthlyRevenue: [],
    channelRoi: [],
    funnelData: { leads: 0, meetings: 0, deals: 0, dealsValue: 0 },
  }

  const revenueTrend = e.monthlyRevenue ?? []
  const lastRevenue = revenueTrend.length > 0 ? revenueTrend[revenueTrend.length - 1].revenue : 0
  const revenueChartData =
    revenueTrend.length > 0
      ? [
          ...revenueTrend.map((m) => ({ ...m, forecast: null as number | null })),
          { month: 'F1', revenue: null as number | null, forecast: Math.round(lastRevenue * 1.05) },
          { month: 'F2', revenue: null as number | null, forecast: Math.round(lastRevenue * 1.1) },
        ]
      : []

  const recs = insights?.insights?.length
    ? insights.insights
    : [
        '₹42k pipeline at risk – nurture now',
        'Instagram 3x RoI vs FB – shift budget',
        'WhatsApp 47% open rate – try 2x frequency',
      ]
  const recLabels = ['Top Priority', 'Opportunity', 'WhatsApp / Channel']
  const recIcons = [Rocket, Target, MessageCircle]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Marketing Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.name ? `Welcome back, ${user.name}` : 'Revenue & AI-driven insights'}
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Band 1: Revenue-focused KPIs (₹) */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="Marketing Revenue"
            value={formatINRForDisplay(e.marketingRevenue)}
            subtitle={e.avgRevenuePerMonth > 0 ? `₹${(e.avgRevenuePerMonth / 1000).toFixed(0)}k avg/mo` : undefined}
            trend={
              e.revenueGrowth !== 0 ? (
                <span className={e.revenueGrowth >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {e.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(e.revenueGrowth)}%
                </span>
              ) : undefined
            }
            icon={<IndianRupee className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="Leads Generated"
            value={e.leadsGenerated.toLocaleString('en-IN')}
            subtitle={e.conversionRate > 0 ? `Conv ${e.conversionRate}%` : undefined}
            icon={<Users className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="Total Reach"
            value={e.totalReach >= 1000000 ? `${(e.totalReach / 1000000).toFixed(1)}M` : e.totalReach >= 1000 ? `${(e.totalReach / 1000).toFixed(1)}k` : e.totalReach}
            subtitle={e.avgPerReach > 0 ? `₹${e.avgPerReach.toFixed(2)}/reach` : undefined}
            icon={<TrendingUp className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="RoI"
            value={e.roi > 0 ? `${e.roi}x` : '—'}
            subtitle={e.roi > 0 ? `${formatINRForDisplay(e.marketingRevenue)} / spend` : 'Track in Ads'}
            icon={<BarChart3 className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="GST Compliant"
            value={`${e.gstCompliantPct}%`}
            subtitle={e.gstTotalInvoices > 0 ? `${e.gstCompliantCount}/${e.gstTotalInvoices} invoices` : undefined}
            icon={<FileText className="w-4 h-4" />}
            height="sm"
          />
        </section>

        {/* Band 2: AI Recommendations */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Recommendations
            {insights?.source === 'ollama' && (
              <span className="text-[10px] font-normal normal-case text-emerald-600 dark:text-emerald-400">(self-hosted)</span>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recs.slice(0, 3).map((text, i) => {
              const Icon = recIcons[i]
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex gap-3"
                >
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                    <Icon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{recLabels[i]}</p>
                    <p className="text-sm text-slate-900 dark:text-slate-50 mt-0.5">{text}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Ask the page AI (bottom-right): &quot;Analyze my last campaign&quot;
          </p>
        </section>

        {/* Band 3: Predictive charts */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard title="Revenue trend" subtitle="Past + 30d forecast (dotted)" className="xl:col-span-2">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => (v != null ? [formatINRForDisplay(v), ''] : [])} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke={PURPLE_PRIMARY} name="Revenue" strokeWidth={2} connectNulls />
                  <Line type="monotone" dataKey="forecast" stroke={GOLD_ACCENT} strokeDasharray="5 5" name="30d forecast" connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Channel RoI" subtitle="By channel">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={e.channelRoi}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="roi" fill={SUCCESS} name="RoI (x)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Funnel" subtitle="Leads → Meetings → Deals (₹)" className="xl:col-span-3">
            <div className="h-[200px] flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{e.funnelData.leads.toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Leads</p>
              </div>
              <span className="text-slate-400">→</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{e.funnelData.meetings}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Meetings</p>
              </div>
              <span className="text-slate-400">→</span>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{e.funnelData.deals}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Deals</p>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{formatINRForDisplay(e.funnelData.dealsValue)}</p>
              </div>
            </div>
          </ChartCard>
        </section>

        {/* Band 4: Quick Stats (contextual) */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Quick Stats
          </h2>
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Channel breakdown</p>
              <p className="text-sm text-slate-900 dark:text-slate-50">
                WA {e.channelBreakdownPct.whatsapp}% | Email {e.channelBreakdownPct.email}% | FB {e.channelBreakdownPct.facebook}% | LinkedIn {e.channelBreakdownPct.linkedin}%
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Campaign health</p>
              <p className="text-sm text-slate-900 dark:text-slate-50">
                {e.campaignHealth.optimalPct}% optimal | {e.campaignHealth.underperformPct}% underperform | {e.campaignHealth.failingPct}% failing
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Audience</p>
              <p className="text-sm text-slate-900 dark:text-slate-50">
                {e.audience.active.toLocaleString('en-IN')} active | {e.audience.engaged.toLocaleString('en-IN')} engaged | {e.audience.highValue} high-value
              </p>
            </div>
          </div>
        </section>

        {/* Band 5: One-click actions */}
        <section className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-shrink-0">
            <Zap className="h-4 w-4" />
            One-Click Actions
          </span>
          <Link href={`/marketing/${tenantId}/Campaigns/New`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 gap-2">
              <Plus className="h-4 w-4" /> New Campaign
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Campaigns/New?type=whatsapp`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 gap-2">
              <MessageCircle className="h-4 w-4" /> WhatsApp Blast
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Creative-Studio`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 gap-2">
              <LayoutGrid className="h-4 w-4" /> Creative Studio
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Sequences`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 gap-2">
              <GitBranch className="h-4 w-4" /> WhatsApp Sequence
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Analytics`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 gap-2">
              <BarChart3 className="h-4 w-4" /> Full Analytics
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/AI-Influencer`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 gap-2">
              <Video className="h-4 w-4" /> AI Influencer Video
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Analytics`}>
            <Button variant="outline" size="sm" className="h-9 border-slate-300 dark:border-slate-700 gap-2">
              <FileText className="h-4 w-4" /> Generate Report
            </Button>
          </Link>
        </section>
      </div>
    </div>
  )
}
