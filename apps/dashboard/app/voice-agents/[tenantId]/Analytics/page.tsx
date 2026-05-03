// @ts-nocheck
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatCard } from '@/components/ui/StatCard'
import { ChartCard } from '@/components/ui/ChartCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Download, Pencil, Copy } from 'lucide-react'
import { formatINRCompact } from '@/lib/currency'

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

const PURPLE_GOLD = {
  line: '#7c3aed',
  bar: '#a78bfa',
  pie: ['#7c3aed', '#eab308', '#a78bfa', '#f59e0b', '#8b5cf6'],
}

export default function VoiceAgentAnalyticsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const [analytics, setAnalytics] = useState<any>(null)
  const [agents, setAgents] = useState<{ id: string; name: string }[]>([])
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<string>('today')
  const [agentId, setAgentId] = useState<string>('all')
  const [campaignId, setCampaignId] = useState<string>('all')
  const [language, setLanguage] = useState<string>('all')
  const [startDate, setStartDate] = useState(toDateOnly(new Date()))
  const [endDate, setEndDate] = useState(toDateOnly(new Date()))

  const fetchAnalytics = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth-token')
      if (!token) return
      const url = new URL('/api/v1/voice-agents/analytics', window.location.origin)
      url.searchParams.set('period', period)
      if (agentId && agentId !== 'all') url.searchParams.set('agentId', agentId)
      if (campaignId && campaignId !== 'all') url.searchParams.set('campaignId', campaignId)
      if (language && language !== 'all') url.searchParams.set('language', language)
      if (period === 'custom') {
        url.searchParams.set('startDate', startDate)
        url.searchParams.set('endDate', endDate)
      }
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data.analytics)
      } else {
        setAnalytics(null)
      }
    } catch {
      setAnalytics(null)
    } finally {
      setLoading(false)
    }
  }, [period, agentId, campaignId, language, startDate, endDate])

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('auth-token')
    if (!token) return
    Promise.all([
      fetch('/api/v1/voice-agents', { headers: { Authorization: `Bearer ${token}` } }),
      fetch('/api/v1/voice-agents/campaigns', { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(([aRes, cRes]) => {
      if (aRes.ok) aRes.json().then((d: any) => setAgents(d?.agents ?? d ?? []))
      if (cRes.ok) cRes.json().then((d: any) => setCampaigns((d?.campaigns ?? []).map((c: any) => ({ id: c.id, name: c.name }))))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  const exportCSV = () => {
    if (!analytics?.overview) return
    const ov = analytics.overview
    const rows = [
      ['Metric', 'Value'],
      ['Total Calls', String(ov.totalCalls ?? 0)],
      ['Conversion %', `${(ov.conversionRate ?? 0).toFixed(1)}%`],
      ['Avg Duration', formatDuration(ov.averageDuration ?? 0)],
      ['Revenue', formatINRCompact(ov.revenueGenerated ?? 0)],
    ]
    if (analytics.topPerformers?.length) {
      rows.push([])
      rows.push(['Agent', 'Calls', 'Conv%', 'Revenue'])
      analytics.topPerformers.forEach((a: any) => {
        rows.push([a.agentName, String(a.calls), `${a.conversionRate}%`, formatINRCompact(a.revenueRupees ?? 0)])
      })
    }
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `voice-analytics-${toDateOnly(new Date())}.csv`
    link.click()
    URL.revokeObjectURL(link.href)
  }

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        Loading analytics...
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="space-y-5 max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center gap-3">
          <Link href={`/voice-agents/${tenantId}/Home`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">Analytics</h1>
        </div>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No analytics data yet. Make calls to see live insights and optimise campaigns.
          </CardContent>
        </Card>
      </div>
    )
  }

  const ov = analytics.overview || {}
  const conversionByAgent = analytics.conversionByAgent || []
  const callsByLanguage = analytics.callsByLanguage || []
  const hourlyVolume = analytics.hourlyVolume || []
  const topPerformers = analytics.topPerformers || []

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href={`/voice-agents/${tenantId}/Home`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Analytics</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] border-violet-200 dark:border-violet-800">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          {period === 'custom' && (
            <>
              <Label className="text-xs sr-only">From</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[140px]"
              />
              <Label className="text-xs sr-only">To</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[140px]"
              />
            </>
          )}
          <Select value={agentId} onValueChange={setAgentId}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All agents</SelectItem>
              {agents.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {[...new Set(callsByLanguage.map((x: any) => x.language))].map((lang) => (
                <SelectItem key={lang} value={lang}>{lang}</SelectItem>
              ))}
              {callsByLanguage.length === 0 && <SelectItem value="en">English</SelectItem>}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => fetchAnalytics()}>
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Section 1: Overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total calls"
          value={(ov.totalCalls ?? 0).toLocaleString()}
          subtitle="In selected period"
          height="sm"
        />
        <StatCard
          title="Conversion"
          value={`${(ov.conversionRate ?? 0).toFixed(1)}%`}
          subtitle={`${ov.completedCalls ?? 0} completed`}
          height="sm"
        />
        <StatCard
          title="Avg duration"
          value={formatDuration(ov.averageDuration ?? 0)}
          subtitle="Per answered call"
          height="sm"
        />
        <StatCard
          title="Revenue generated"
          value={formatINRCompact(ov.revenueGenerated ?? 0)}
          subtitle="Voice pipeline"
          height="sm"
        />
      </div>

      {/* Section 2: Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ChartCard title="Calls per hour" subtitle="Last 24h / period">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={hourlyVolume}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: '8px' }} />
              <Line type="monotone" dataKey="count" stroke={PURPLE_GOLD.line} strokeWidth={2} dot={{ r: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Conversion by agent" subtitle="% completed">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={conversionByAgent.length ? conversionByAgent : [{ agent: '—', conversionRate: 0 }]} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="agent" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(v: number) => [`${v}%`, 'Conversion']} />
              <Bar dataKey="conversionRate" fill={PURPLE_GOLD.bar} radius={[4, 4, 0, 0]} name="Conversion %" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Language breakdown" subtitle="Calls by language">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={callsByLanguage.length ? callsByLanguage : [{ language: 'No data', count: 1 }]}
                dataKey="count"
                nameKey="language"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ language, percent }) => `${language} ${(percent * 100).toFixed(0)}%`}
              >
                {(callsByLanguage.length ? callsByLanguage : [{ language: 'No data', count: 1 }]).map((_: any, i: number) => (
                  <Cell key={i} fill={PURPLE_GOLD.pie[i % PURPLE_GOLD.pie.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px' }} formatter={(v: number) => [v, 'Calls']} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Section 3: Top performers */}
      <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base">Top performers</CardTitle>
          <CardDescription>Agent performance — scale winners, optimise campaigns.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {topPerformers.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No agent data in this period. Make calls to see performance.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Conv%</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPerformers.map((a: { agentId: string; agentName: string; calls: number; conversionRate: number; revenueRupees: number }) => (
                  <TableRow key={a.agentId}>
                    <TableCell className="font-medium">{a.agentName}</TableCell>
                    <TableCell className="text-right">{a.calls.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{a.conversionRate}%</TableCell>
                    <TableCell className="text-right">{formatINRCompact(a.revenueRupees ?? 0)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Link href={`/voice-agents/${tenantId}/studio?agent=${a.agentId}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/voice-agents/${tenantId}/create?clone=${a.agentId}`}>
                          <Button variant="ghost" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
