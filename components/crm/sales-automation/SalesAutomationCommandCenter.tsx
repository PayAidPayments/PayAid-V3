'use client'

import dynamic from 'next/dynamic'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  Filter,
  Layers3,
  ListChecks,
  Loader2,
  Plus,
  Radio,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react'
import { useAuthStore } from '@/lib/stores/auth'
import { usePageAIExtraStore } from '@/lib/stores/page-ai-extra'
import { StatCard } from '@/components/ui/StatCard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PageLoading } from '@/components/ui/loading'
import type { OutreachCampaign } from './types'
import type { WorkspacePayload } from '@/components/crm/sales-automation/workspace-types'
import { campaignToSequenceRow } from './buildWorkspaceModel'

const SalesAutomationAnalyticsTab = dynamic(
  () => import('./SalesAutomationAnalyticsTab').then((m) => ({ default: m.SalesAutomationAnalyticsTab })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading analytics…
      </div>
    ),
  }
)

type TabId =
  | 'overview'
  | 'sequences'
  | 'workflows'
  | 'signals'
  | 'queue'
  | 'execution'
  | 'analytics'
  | 'templates'

export function SalesAutomationCommandCenter() {
  const params = useParams()
  const tenantId = (params?.tenantId as string) || ''
  const { token } = useAuthStore()
  const setPageAiExtra = usePageAIExtraStore((s) => s.setExtra)

  const [loading, setLoading] = useState(true)
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<TabId>('overview')
  const [dateRange, setDateRange] = useState('30d')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [queueLimit, setQueueLimit] = useState(12)
  const [logLimit, setLogLimit] = useState(18)

  const [sheetAutomation, setSheetAutomation] = useState(false)
  const [sheetSequence, setSheetSequence] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    type: 'cold-email' as OutreachCampaign['type'],
    targetCriteria: '',
  })

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(id)
  }, [search])

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      setLoadError(null)
      const qs = new URLSearchParams({
        dateRange,
        channel: channelFilter,
        status: statusFilter,
        search: debouncedSearch,
        queueSkip: '0',
        queueTake: String(queueLimit),
        logSkip: '0',
        logTake: String(logLimit),
      })
      const res = await fetch(`/api/crm/sales-automation/workspace?${qs.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || err.error || `HTTP ${res.status}`)
      }
      const data = (await res.json()) as WorkspacePayload
      setWorkspace(data)
    } catch (e: unknown) {
      console.error(e)
      setWorkspace(null)
      setLoadError(e instanceof Error ? e.message : 'Failed to load workspace')
    } finally {
      setLoading(false)
    }
  }, [token, dateRange, channelFilter, statusFilter, debouncedSearch, queueLimit, logLimit])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const automations = workspace?.automations ?? []
  const kpis = workspace?.kpis
  const executionRows = workspace?.executionLog.rows ?? []
  const executionTotal = workspace?.executionLog.total ?? 0
  const executionLogWindowDays = workspace?.meta.executionLogWindowDays ?? 90
  const workflowRows = workspace?.workflows ?? []
  const signalRows = workspace?.signals ?? []
  const templateRows = workspace?.templates ?? []
  const sequenceRows = automations.map(campaignToSequenceRow)
  const prospectQueueRows = workspace?.prospectQueue.rows ?? []
  const prospectQueueTotal = workspace?.prospectQueue.total ?? 0
  const deliverability = workspace?.deliverability

  useEffect(() => {
    setPageAiExtra({
      surface: 'crm_sales_automation',
      tenantId,
      tab,
      kpiSnapshot: kpis ?? {},
      activeAutomationNames: automations.filter((c) => c.status === 'active').map((c) => c.name),
    })
    return () => setPageAiExtra(null)
  }, [setPageAiExtra, tenantId, tab, kpis, automations])

  const handleCreateAutomation = async () => {
    if (!newCampaign.name.trim() || !token) return
    setCreating(true)
    try {
      const response = await fetch('/api/crm/sales-automation/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCampaign),
      })
      if (response.ok) {
        setSheetAutomation(false)
        setNewCampaign({ name: '', type: 'cold-email', targetCriteria: '' })
        await fetchData()
      } else {
        const err = await response.json().catch(() => ({}))
        alert(err.error || 'Failed to create automation')
      }
    } catch {
      alert('Failed to create automation')
    } finally {
      setCreating(false)
    }
  }

  const nextBestActions = useMemo(
    () => [
      {
        id: 'nba-1',
        title: 'Approve WhatsApp template batch',
        detail: `${kpis?.pendingReviews ?? 0} pending reviews across AI decisions and high-score prospects.`,
        action: 'tab' as const,
        tabTarget: 'execution' as TabId,
      },
      {
        id: 'nba-2',
        title: 'Resume paused sequence',
        detail: `${automations.filter((c) => c.status === 'paused').length} paused · check deliverability first.`,
        action: 'link' as const,
        href: `/crm/${tenantId}/OutboxOps`,
      },
      {
        id: 'nba-3',
        title: 'Triage high-intent queue',
        detail: `${prospectQueueRows.filter((r) => r.intentScore >= 70).length} prospects over 70 score in queue.`,
        action: 'tab' as const,
        tabTarget: 'queue' as TabId,
      },
    ],
    [automations, prospectQueueRows, tenantId, kpis?.pendingReviews]
  )

  if (loading) {
    return <PageLoading message="Loading sales automation…" fullScreen={false} />
  }

  const k = kpis ?? {
    activeAutomations: 0,
    leadsEnrolled: 0,
    leadsEnrolledInPeriod: 0,
    replyRate: 0,
    meetingsBooked: 0,
    conversionRate: 0,
    failedActions: 0,
    pendingReviews: 0,
    autoTasksCreated: 0,
  }

  return (
    <div className="max-w-7xl mx-auto w-full space-y-5 pb-10">
      {loadError ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
          role="alert"
        >
          <span className="font-medium">Could not load live workspace.</span> {loadError} You can still use links to
          Signals, Workflows, and Sequences.
        </div>
      ) : null}
      <header
        className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"
        data-testid="sales-automation-header"
      >
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Sales Automation
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Command center for sequences, workflows, signals, enrollment, execution health, and approvals — not
            just campaign totals.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/crm/${tenantId}/Leads`}>Import / enroll</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSheetSequence(true)} title="Opens sequence builder">
            Create sequence
          </Button>
          <Button size="sm" onClick={() => setSheetAutomation(true)} title="Create a new automation">
            <Plus className="h-4 w-4 mr-1.5" />
            Create automation
          </Button>
        </div>
      </header>

      <div className="flex flex-col xl:flex-row gap-3 flex-wrap items-stretch xl:items-center justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 px-3 py-3 gap-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Filter className="h-4 w-4" />
            <span className="text-xs font-medium uppercase tracking-wide">Filters</span>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="h-9 w-[130px]" aria-label="Date range">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="h-9 w-[120px]" aria-label="Owner">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All owners</SelectItem>
              <SelectItem value="me">My automations</SelectItem>
              <SelectItem value="team">My team</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="h-9 w-[140px]" aria-label="Channel">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All channels</SelectItem>
              <SelectItem value="cold-email">Email</SelectItem>
              <SelectItem value="cold-call">Call</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="multi-channel">Multi-channel</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[120px]" aria-label="Status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search automations…"
              className="pl-9 h-9"
              aria-label="Search automations"
            />
          </div>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={() => void fetchData()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="space-y-2" aria-label="Operational KPIs">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Metrics window:{' '}
          {dateRange === '7d' ? 'Last 7 days' : dateRange === '90d' ? 'Last 90 days' : 'Last 30 days'}
          {ownerFilter !== 'all' ? ` · Owner: ${ownerFilter === 'me' ? 'Mine' : 'Team'}` : ''}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <StatCard title="Active automations" value={k.activeAutomations} icon={<Zap />} />
        <StatCard
          title="Leads enrolled"
          value={k.leadsEnrolled}
          subtitle={`Today · ${k.leadsEnrolledInPeriod} in selected window`}
          icon={<Layers3 />}
        />
        <StatCard title="Reply rate" value={`${k.replyRate.toFixed(1)}%`} icon={<Radio />} />
        <StatCard title="Meetings booked" value={k.meetingsBooked} icon={<CheckCircle2 />} />
        <StatCard title="Conversion" value={`${k.conversionRate.toFixed(1)}%`} icon={<Activity />} />
        <StatCard title="Failed actions" value={k.failedActions} subtitle="7d · needs triage" icon={<AlertTriangle />} />
        <StatCard title="Pending reviews" value={k.pendingReviews} icon={<ClipboardList />} />
        <StatCard title="Auto tasks" value={k.autoTasksCreated} subtitle="CRM tasks created today" icon={<ListChecks />} />
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-8 space-y-4 min-w-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as TabId)} className="w-full">
            <div
              className="sticky top-0 z-20 -mx-1 px-1 py-2 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200/60 dark:border-slate-800/80"
              data-testid="sales-automation-tabs"
            >
              <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-slate-100/90 dark:bg-slate-900/90 p-1 rounded-lg">
                {(
                  [
                    ['overview', 'Overview'],
                    ['sequences', 'Sequences'],
                    ['workflows', 'Workflows'],
                    ['signals', 'Signals'],
                    ['queue', 'Prospect queue'],
                    ['execution', 'Execution log'],
                    ['analytics', 'Analytics'],
                    ['templates', 'Templates'],
                  ] as const
                ).map(([id, label]) => (
                  <TabsTrigger key={id} value={id} className="text-xs sm:text-sm px-2.5 py-1.5">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card
                className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm"
                data-testid="running-automations-panel"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold">Running automations</CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-xs h-8">
                      <Link href={`/crm/${tenantId}/sequences`}>
                        Open builder <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    Live enrollment, channel mix, and health — pause or drill into execution from the log tab.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  {sequenceRows.length === 0 ? (
                    <p className="text-sm text-slate-500 py-6 text-center">No automations match filters.</p>
                  ) : (
                    sequenceRows.slice(0, 4).map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2.5 hover:shadow-sm transition-shadow"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm text-slate-900 dark:text-slate-50 truncate">{r.name}</span>
                            <Badge
                              variant="secondary"
                              className={
                                r.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                                  : r.status === 'paused'
                                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'
                                    : ''
                              }
                            >
                              {r.status}
                            </Badge>
                            <span className="text-[11px] text-slate-500">{r.channels}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Objective: {r.objective} · Active {r.activeInSeq} · Reply {r.responseRate.toFixed(1)}% ·
                            Meetings {r.meetingRate.toFixed(1)}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {r.status === 'active' ? (
                            <Button variant="outline" size="sm" className="h-8 text-xs" title="Pause automation">
                              Pause
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" className="h-8 text-xs" title="Resume automation">
                              Resume
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                            <Link href={`/crm/${tenantId}/sequences`}>Edit</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Sequence performance snapshot</CardTitle>
                    <CardDescription className="text-xs">Top sequences by reply + meeting proxy</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm space-y-2">
                    {sequenceRows.slice(0, 3).map((r) => (
                      <div key={r.id} className="flex justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0 pb-2 last:pb-0">
                        <span className="truncate font-medium">{r.name}</span>
                        <span className="text-slate-500 shrink-0">
                          {r.responseRate.toFixed(0)}% / {r.meetingRate.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm" id="prospect-queue">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Prospect queue preview</CardTitle>
                    <CardDescription className="text-xs">Triage-ready rows with recommended next step</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {prospectQueueRows.slice(0, 4).map((p) => (
                      <div key={p.id} className="rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 text-xs">
                        <div className="flex justify-between gap-2">
                          <span className="font-medium text-slate-900 dark:text-slate-50">{p.name}</span>
                          <Badge variant="outline">{p.intentScore}</Badge>
                        </div>
                        <p className="text-slate-500 mt-1">{p.nextAction}</p>
                      </div>
                    ))}
                    {prospectQueueRows.length === 0 && (
                      <p className="text-sm text-slate-500">No prospects in queue. Pull from Leads or Signals.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="sequences" className="mt-4">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Sequences & automations</CardTitle>
                  <CardDescription className="text-xs">
                    Rich operational view — builder, pause/resume, and enroll live on the Sequences workspace.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto" data-testid="sequence-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Objective</TableHead>
                          <TableHead>Persona</TableHead>
                          <TableHead>Channels</TableHead>
                          <TableHead className="text-right">Active</TableHead>
                          <TableHead className="text-right">Reply</TableHead>
                          <TableHead className="text-right">Meetings</TableHead>
                          <TableHead className="text-right">Conv</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sequenceRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="font-medium whitespace-nowrap">{r.name}</TableCell>
                            <TableCell className="text-xs text-slate-600 max-w-[140px]">{r.objective}</TableCell>
                            <TableCell className="text-xs">{r.persona}</TableCell>
                            <TableCell className="text-xs whitespace-nowrap">{r.channels}</TableCell>
                            <TableCell className="text-right">{r.activeInSeq}</TableCell>
                            <TableCell className="text-right">{r.responseRate.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{r.meetingRate.toFixed(1)}%</TableCell>
                            <TableCell className="text-right">{r.conversionRate.toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                {r.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs">{r.owner}</TableCell>
                            <TableCell className="text-right space-x-1 whitespace-nowrap">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
                                <Link href={`/crm/${tenantId}/sequences`}>Open</Link>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                Duplicate
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows" className="mt-4">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm" data-testid="workflow-list">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-sm font-semibold">Workflow rules</CardTitle>
                      <CardDescription className="text-xs">
                        Trigger → filter → action. Author in Workflows; monitor failures here.
                      </CardDescription>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/crm/${tenantId}/Workflows`}>Open workflow builder</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  {workflowRows.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-xl border border-slate-200/80 dark:border-slate-800 p-3 space-y-1.5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-sm">{w.name}</span>
                        <Badge variant="outline" className="capitalize text-[10px]">
                          {w.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Trigger:</span> {w.trigger}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">If</span> {w.conditions}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-medium text-slate-700 dark:text-slate-300">Then</span> {w.actions}{' '}
                        <span className="text-slate-400">· {w.delays}</span>
                      </p>
                      <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 pt-1">
                        <span>Owner: {w.owner}</span>
                        {w.lastRun ? <span>Last run: {format(new Date(w.lastRun), 'MMM d HH:mm')}</span> : null}
                        <span className={w.failures7d > 0 ? 'text-amber-700 dark:text-amber-300' : ''}>
                          Failures (7d): {w.failures7d}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="signals" className="mt-4">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-2 flex flex-row flex-wrap items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">Actionable signals</CardTitle>
                    <CardDescription className="text-xs">Route to queue, enroll, or create tasks</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <Link href={`/crm/${tenantId}/Signals`}>Signal inbox</Link>
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto" data-testid="signals-table">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Signal</TableHead>
                          <TableHead>Account / lead</TableHead>
                          <TableHead>Severity</TableHead>
                          <TableHead>Suggested</TableHead>
                          <TableHead className="text-right">Quick</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {signalRows.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell className="text-sm">{s.label}</TableCell>
                            <TableCell className="text-sm">{s.company}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  s.severity === 'hot'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                }
                              >
                                {s.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600 max-w-[180px]">{s.suggested}</TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                Enroll
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                Task
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="queue" className="mt-4">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Prospect queue</CardTitle>
                  <CardDescription className="text-xs">
                    Operational triage — enroll, assign, pause, or exclude without leaving the row.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto" data-testid="prospect-queue">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead className="text-right">Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Sequence</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Next</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {prospectQueueRows.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium whitespace-nowrap">{p.name}</TableCell>
                            <TableCell className="text-sm">{p.company ?? '—'}</TableCell>
                            <TableCell className="text-xs">{p.source}</TableCell>
                            <TableCell className="text-right">{p.intentScore}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[10px] capitalize">
                                {p.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-[120px] truncate">{p.enrolledSeq}</TableCell>
                            <TableCell className="text-xs">{p.owner}</TableCell>
                            <TableCell className="text-xs max-w-[200px]">{p.nextAction}</TableCell>
                            <TableCell className="text-right space-x-1 whitespace-nowrap">
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                Enroll
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                Assign
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-600">
                                Exclude
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {prospectQueueTotal > prospectQueueRows.length && (
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setQueueLimit((n) => n + 20)}>
                        Load more
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="execution" className="mt-4">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Execution log</CardTitle>
                  <CardDescription className="text-xs">
                    Every automated action: who, what channel, outcome, retries, and approvals. Totals and paging cover
                    the last {executionLogWindowDays} days.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto" data-testid="execution-log">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Time</TableHead>
                          <TableHead>Prospect</TableHead>
                          <TableHead>Automation</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Channel</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Next</TableHead>
                          <TableHead>Error / approval</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {executionRows.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="text-xs whitespace-nowrap">
                              {format(new Date(row.at), 'MMM d HH:mm')}
                            </TableCell>
                            <TableCell className="text-sm">{row.prospect}</TableCell>
                            <TableCell className="text-xs max-w-[140px]">{row.automation}</TableCell>
                            <TableCell className="text-xs">{row.action}</TableCell>
                            <TableCell className="text-xs">{row.channel}</TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className={
                                  row.status === 'failed'
                                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40'
                                    : row.status === 'retry'
                                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'
                                      : row.status === 'pending_approval'
                                        ? 'bg-violet-100 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100'
                                        : ''
                                }
                              >
                                {row.status.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs max-w-[120px]">{row.next}</TableCell>
                            <TableCell className="text-xs text-slate-600">
                              {row.error ?? (row.approvedBy ? `Approved: ${row.approvedBy}` : '—')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {executionTotal > logLimit && (
                    <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setLogLimit((n) => n + 25)}>
                        Load more
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-4">
              <SalesAutomationAnalyticsTab campaigns={automations} />
            </TabsContent>

            <TabsContent value="templates" className="mt-4">
              <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold">Templates library</CardTitle>
                  <CardDescription className="text-xs">Approval, usage, and performance by channel</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Usage</TableHead>
                        <TableHead className="text-right">Reply %</TableHead>
                        <TableHead>Owner</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templateRows.map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="text-sm">{t.channel}</TableCell>
                          <TableCell className="font-medium text-sm">{t.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize text-[10px]">
                              {t.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{t.usage}</TableCell>
                          <TableCell className="text-right">{t.replyPct.toFixed(1)}</TableCell>
                          <TableCell className="text-xs">{t.owner}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <aside className="xl:col-span-4 space-y-4 min-w-0">
          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Next best actions</CardTitle>
              <CardDescription className="text-xs">Manager + rep workload</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {nextBestActions.map((a) =>
                a.action === 'link' ? (
                  <Link
                    key={a.id}
                    href={a.href}
                    className="block rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>
                  </Link>
                ) : (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setTab(a.tabTarget)}
                    className="w-full text-left rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors"
                  >
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{a.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.detail}</p>
                  </button>
                )
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Hot signals</CardTitle>
              <CardDescription className="text-xs">Urgent intent worth a human touch</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {signalRows.slice(0, 4).map((s) => (
                <div key={s.id} className="rounded-xl border border-slate-200/80 dark:border-slate-800 px-3 py-2 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-50">{s.company}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {s.severity}
                    </Badge>
                  </div>
                  <p className="text-slate-500 mt-1">{s.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Pending approvals
              </CardTitle>
              <CardDescription className="text-xs">Safety gates before high-risk sends</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span>WhatsApp batch #441</span>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Review
                </Button>
              </div>
              <div className="flex justify-between gap-2">
                <span>New enrollment rule</span>
                <Button size="sm" variant="outline" className="h-7 text-xs">
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card
            className="rounded-2xl border border-violet-200/80 dark:border-violet-900/50 shadow-sm bg-gradient-to-b from-violet-50/50 to-white dark:from-violet-950/20 dark:to-slate-900"
            data-testid="ai-sales-specialist"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                Sales Automation specialist
              </CardTitle>
              <CardDescription className="text-xs">
                Contextual guidance for this tenant&apos;s automations — open PayAid AI for deeper drill-down.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <p>
                <span className="font-medium text-slate-800 dark:text-slate-200">Sequences:</span>{' '}
                {sequenceRows[0]?.name ?? '—'} is your strongest reply-rate lever; consider A/B on step 2 wait time.
              </p>
              <p>
                <span className="font-medium text-slate-800 dark:text-slate-200">Risk:</span>{' '}
                {k.failedActions} failed actions in the rolling window — check Execution log for SMTP and consent
                errors.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => window.dispatchEvent(new CustomEvent('open-page-ai'))}
              >
                <Bot className="h-3.5 w-3.5 mr-1.5" />
                Ask PayAid AI
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Deliverability & health</CardTitle>
              <CardDescription className="text-xs">Outbox + suppression posture</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">Bounces (7d)</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {deliverability?.bounceCount7d ?? '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-400">Bounce / sends (7d est.)</span>
                <span
                  className={`font-medium ${
                    (deliverability?.bounceRatePct ?? 0) > 3
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {deliverability?.bounceRatePct != null ? `${deliverability.bounceRatePct.toFixed(2)}%` : '—'}
                </span>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-1 h-8 text-xs" asChild>
                <Link href={`/crm/${tenantId}/OutboxOps`}>Open Outbox Ops</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Sheet open={sheetAutomation} onOpenChange={setSheetAutomation}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create automation</SheetTitle>
            <SheetDescription>
              Draft an automation shell. Wire triggers, branches, and approvals in Workflows and Sequences.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-6">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
              <Input
                value={newCampaign.name}
                onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                placeholder="e.g. Enterprise reactivation"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Primary channel mix</label>
              <select
                value={newCampaign.type}
                onChange={(e) => setNewCampaign({ ...newCampaign, type: e.target.value as OutreachCampaign['type'] })}
                className="mt-1 w-full h-10 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
              >
                <option value="cold-email">Email-first</option>
                <option value="cold-call">Call-first</option>
                <option value="linkedin">LinkedIn</option>
                <option value="multi-channel">Multi-channel</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Enrollment criteria</label>
              <textarea
                value={newCampaign.targetCriteria}
                onChange={(e) => setNewCampaign({ ...newCampaign, targetCriteria: e.target.value })}
                placeholder="ICP, territory, score thresholds, suppression rules…"
                className="mt-1 w-full min-h-[100px] rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setSheetAutomation(false)}>
                Cancel
              </Button>
              <Button onClick={() => void handleCreateAutomation()} disabled={!newCampaign.name.trim() || creating} title={creating ? 'Creating…' : 'Create'}>
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating…
                  </>
                ) : (
                  'Create automation'
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={sheetSequence} onOpenChange={setSheetSequence}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Create sequence</SheetTitle>
            <SheetDescription>
              Sequences support steps, waits, branches, and stop rules. Continue in the dedicated builder.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-8 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You will configure cadence logic, channel order, exit criteria, and templates in the Sequences workspace.
            </p>
            <Button asChild className="w-full">
              <Link href={`/crm/${tenantId}/sequences`} onClick={() => setSheetSequence(false)}>
                Open sequence builder
              </Link>
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setSheetSequence(false)}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
