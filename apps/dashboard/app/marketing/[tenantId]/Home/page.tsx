'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'
import { Button } from '@/components/ui/button'
import {
  Megaphone,
  TrendingUp,
  Users,
  Heart,
  IndianRupee,
  BarChart3,
  ImageIcon,
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
} from 'lucide-react'
import { PageLoading } from '@/components/ui/loading'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface DashboardStats {
  campaignsLaunched: number
  campaignsLaunchedGrowth: number
  totalReach: number
  totalReachGrowth: number
  engagementRate: number
  conversionRate: number
  totalOpened: number
  totalClicked: number
  totalDelivered: number
  totalSent: number
  socialPostsSent: number
  roi: number | null
}

interface AnalyticsData {
  overview?: {
    totalCampaigns: number
    totalSent: number
    totalDelivered: number
    totalOpened: number
    totalClicked: number
    deliveryRate: number
    openRate: number
    clickRate: number
  }
  byType?: {
    email?: { count: number; sent: number; opened: number; clicked: number }
    whatsapp?: { count: number; sent: number; opened: number; clicked: number }
    sms?: { count: number; sent: number; opened: number; clicked: number }
  }
  monthlyTrend?: Array<{
    month: string
    sent: number
    delivered: number
    opened: number
    clicked: number
  }>
  dailyTrend?: Array<{ date: string; opened: number; clicked: number }>
}

const PURPLE_PRIMARY = '#53328A'
const GOLD_ACCENT = '#F5C700'
const SUCCESS = '#059669'
const INFO = '#0284C7'
const CHART_COLORS = [PURPLE_PRIMARY, GOLD_ACCENT, SUCCESS, INFO, '#EC4899', '#F59E0B']

export default function MarketingDashboardPage() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) ?? ''
  const { user, token } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
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
      fetch(`/api/marketing/dashboard/stats`, { headers, signal: controller.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Failed to load stats'))
      ),
      fetch(`/api/marketing/analytics`, { headers, signal: controller.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject(new Error('Failed to load analytics'))
      ),
    ])
      .then(([statsData, analyticsData]) => {
        setStats(statsData)
        setAnalytics(analyticsData)
        setError(null)
      })
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          setError(e?.message ?? 'Failed to load dashboard')
          setStats(null)
          setAnalytics(null)
        }
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [tenantId, token])

  if (!tenantId) {
    return <PageLoading message="Loading..." fullScreen={true} />
  }
  if (loading) {
    return <PageLoading message="Loading Marketing dashboard..." fullScreen={true} />
  }

  const safeStats: DashboardStats = stats ?? {
    campaignsLaunched: 0,
    campaignsLaunchedGrowth: 0,
    totalReach: 0,
    totalReachGrowth: 0,
    engagementRate: 0,
    conversionRate: 0,
    totalOpened: 0,
    totalClicked: 0,
    totalDelivered: 0,
    totalSent: 0,
    socialPostsSent: 0,
    roi: null,
  }

  const byType = analytics?.byType ?? {}
  const channelBarData = [
    {
      name: 'Email',
      sent: byType.email?.sent ?? 0,
      opened: byType.email?.opened ?? 0,
      clicked: byType.email?.clicked ?? 0,
    },
    {
      name: 'WhatsApp',
      sent: byType.whatsapp?.sent ?? 0,
      opened: byType.whatsapp?.opened ?? 0,
      clicked: byType.whatsapp?.clicked ?? 0,
    },
    {
      name: 'SMS',
      sent: byType.sms?.sent ?? 0,
      opened: byType.sms?.opened ?? 0,
      clicked: byType.sms?.clicked ?? 0,
    },
  ].filter((r) => r.sent > 0 || r.opened > 0 || r.clicked > 0)

  const campaignTypesPie = [
    { name: 'Email', value: byType.email?.count ?? 0 },
    { name: 'WhatsApp', value: byType.whatsapp?.count ?? 0 },
    { name: 'SMS', value: byType.sms?.count ?? 0 },
  ].filter((d) => d.value > 0)

  const monthlyTrend = analytics?.monthlyTrend ?? []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-5 space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Marketing Dashboard
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user?.name ? `Welcome back, ${user.name}` : 'Overview and performance'}
            </p>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 p-4">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Band 1: Hero metrics (5 StatCards) */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          <StatCard
            title="Campaigns Launched"
            value={safeStats.campaignsLaunched}
            trend={
              safeStats.campaignsLaunchedGrowth !== 0 ? (
                <span
                  className={
                    safeStats.campaignsLaunchedGrowth >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {safeStats.campaignsLaunchedGrowth >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(safeStats.campaignsLaunchedGrowth)}%
                </span>
              ) : undefined
            }
            icon={<TrendingUp className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="Total Reach"
            value={
              safeStats.totalReach >= 1000000
                ? `${(safeStats.totalReach / 1000000).toFixed(1)}M`
                : safeStats.totalReach >= 1000
                  ? `${(safeStats.totalReach / 1000).toFixed(1)}k`
                  : safeStats.totalReach
            }
            trend={
              safeStats.totalReachGrowth !== 0 ? (
                <span
                  className={
                    safeStats.totalReachGrowth >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {safeStats.totalReachGrowth >= 0 ? '↑' : '↓'}{' '}
                  {Math.abs(safeStats.totalReachGrowth)}%
                </span>
              ) : undefined
            }
            icon={<Users className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="Engagement Rate"
            value={`${safeStats.engagementRate}%`}
            subtitle={`${safeStats.totalOpened} opened`}
            icon={<Heart className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="Conversion Rate"
            value={`${safeStats.conversionRate}%`}
            subtitle={
              safeStats.totalClicked > 0
                ? `${safeStats.totalClicked.toLocaleString('en-IN')} clicks`
                : undefined
            }
            icon={<IndianRupee className="w-4 h-4" />}
            height="sm"
          />
          <StatCard
            title="RoI"
            value={safeStats.roi != null ? `${safeStats.roi}x` : '—'}
            subtitle="Track in Ads when available"
            icon={<BarChart3 className="w-4 h-4" />}
            height="sm"
          />
        </section>

        {/* Band 2: Feature launcher cards (Creative Studio hero) */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
            Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link
              href={`/marketing/${tenantId}/Creative-Studio`}
              className="md:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-5 flex flex-col justify-between min-h-[120px] hover:shadow-md hover:-translate-y-[1px] transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800">
                  <ImageIcon className="h-6 w-6 text-slate-700 dark:text-slate-300" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    Creative Studio
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Product Studio, Model Studio, Image Ads, Ad Insights
                  </p>
                </div>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 inline-block">
                Create → Product · Model · Image Ads · Insights
              </span>
            </Link>
            <Link
              href={`/marketing/${tenantId}/Social-Media`}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 min-h-[100px]"
            >
              <Share2 className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Social Posts</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Create & schedule</p>
              </div>
            </Link>
            <Link
              href={`/marketing/${tenantId}/Campaigns`}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 min-h-[100px]"
            >
              <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Campaigns</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Email, WhatsApp, SMS</p>
              </div>
            </Link>
            <Link
              href={`/marketing/${tenantId}/Sequences`}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 min-h-[100px]"
            >
              <GitBranch className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Sequences</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Multi-channel flows</p>
              </div>
            </Link>
            <Link
              href={`/marketing/${tenantId}/AI-Influencer`}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 min-h-[100px]"
            >
              <Video className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">AI Influencer</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">UGC video ads</p>
              </div>
            </Link>
            <Link
              href={`/marketing/${tenantId}/Creative-Studio/Ad-Insights`}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-[1px] transition-all duration-200 min-h-[100px]"
            >
              <Lightbulb className="h-5 w-5 text-slate-500 dark:text-slate-400" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Ad Insights</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Winning strategies</p>
              </div>
            </Link>
          </div>
        </section>

        {/* Band 3: Charts */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <ChartCard
            title="Reach & engagement"
            subtitle="Monthly sent, opened, clicked"
            className="xl:col-span-2"
          >
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke={CHART_COLORS[0]} name="Sent" strokeWidth={2} />
                  <Line type="monotone" dataKey="opened" stroke={CHART_COLORS[1]} name="Opened" strokeWidth={2} />
                  <Line type="monotone" dataKey="clicked" stroke={CHART_COLORS[2]} name="Clicked" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Channel breakdown" subtitle="By channel">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelBarData} layout="vertical" margin={{ left: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="sent" fill={CHART_COLORS[0]} name="Sent" />
                  <Bar dataKey="opened" fill={CHART_COLORS[1]} name="Opened" />
                  <Bar dataKey="clicked" fill={CHART_COLORS[2]} name="Clicked" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
          <ChartCard title="Campaign types" subtitle="By type" className="xl:col-span-3">
            <div className="h-[240px]">
              {campaignTypesPie.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={campaignTypesPie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {campaignTypesPie.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
                  No campaign data yet
                </div>
              )}
            </div>
          </ChartCard>
        </section>

        {/* Band 4: AI Insights */}
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Insights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recent activity</p>
              <p className="text-sm text-slate-900 dark:text-slate-50">
                {safeStats.totalClicked > 0
                  ? `${safeStats.totalClicked} clicks from recent campaigns. Top performers in Analytics.`
                  : 'Run campaigns and check Analytics for top performers.'}
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Engagement</p>
              <p className="text-sm text-slate-900 dark:text-slate-50">
                {safeStats.engagementRate > 0
                  ? `Open rate ${safeStats.engagementRate}%. Try A/B subject lines in Campaigns.`
                  : 'Improve open rates with clear subject lines and segments.'}
              </p>
            </div>
            <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Segments</p>
              <p className="text-sm text-slate-900 dark:text-slate-50">
                Use Segments to target high-value contacts, then launch a Sequence or Campaign.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
            <Bot className="h-3 w-3" />
            Ask the page AI (bottom-right) for more insights about your marketing data.
          </p>
        </section>

        {/* Band 5: Quick actions */}
        <section className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-shrink-0">
            <Zap className="h-4 w-4" />
            Quick Actions
          </span>
          <Link href={`/marketing/${tenantId}/Campaigns/New`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
            >
              <Plus className="h-4 w-4" />
              New Campaign
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Creative-Studio`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              New Creative
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Campaigns/New?type=whatsapp`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Blast
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Analytics`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Sequences`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
            >
              <GitBranch className="h-4 w-4" />
              Launch Sequence
            </Button>
          </Link>
          <Link href={`/marketing/${tenantId}/Segments`}>
            <Button
              variant="outline"
              size="sm"
              className="h-9 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 gap-2"
            >
              <Target className="h-4 w-4" />
              Segment Builder
            </Button>
          </Link>
        </section>
      </div>
    </div>
  )
}
