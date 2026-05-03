'use client'

import { useMemo, useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartCard } from '@/components/ui/ChartCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { CampaignDetailPayload, RecipientSampleRow } from '@/lib/marketing/campaign-detail-payload'
import { cn } from '@/lib/utils/cn'

const COLORS = ['#53328A', '#10b981', '#f59e0b', '#ef4444']

function formatTs(iso: string | null | undefined) {
  if (!iso) return '—'
  try {
    return format(new Date(iso), 'MMM d, yyyy HH:mm')
  } catch {
    return '—'
  }
}

export function CampaignDetailTabs({
  payload,
  activeTab: activeTabProp = 'overview',
  onTabChange,
}: {
  payload: CampaignDetailPayload
  activeTab?: string
  onTabChange?: (v: string) => void
}) {
  const [internalTab, setInternalTab] = useState(activeTabProp)
  useEffect(() => {
    setInternalTab(activeTabProp)
  }, [activeTabProp])
  const tabValue = onTabChange ? activeTabProp : internalTab
  const setTabValue = onTabChange ?? setInternalTab

  const { campaign, template, contentPreview, audience, performance, activityLog, recipientsSample, providerStats } =
    payload
  const [audienceQuery, setAudienceQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [drawerRow, setDrawerRow] = useState<RecipientSampleRow | null>(null)

  const filteredRecipients = useMemo(() => {
    let rows = recipientsSample
    if (statusFilter !== 'all') {
      rows = rows.filter((r) => r.status.toLowerCase() === statusFilter.toLowerCase())
    }
    const q = audienceQuery.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.email?.toLowerCase().includes(q) ?? false) ||
        (r.phone?.toLowerCase().includes(q) ?? false)
    )
  }, [recipientsSample, audienceQuery, statusFilter])

  const funnelData = [
    { name: 'Audience', value: payload.summary.audienceCount },
    { name: 'Sent', value: payload.summary.sentCount },
    { name: 'Delivered', value: payload.summary.deliveredCount },
    { name: 'Engaged', value: campaign.opened + campaign.clicked },
  ]

  const pieDelivery = [
    { name: 'Delivered', value: Math.max(0, campaign.delivered), fill: '#10b981' },
    { name: 'Failed', value: Math.max(0, payload.summary.failedCount), fill: '#ef4444' },
    {
      name: 'Pending',
      value: Math.max(0, payload.summary.pendingCount),
      fill: '#f59e0b',
    },
  ]

  const hasPerf = payload.summary.sentCount > 0 || payload.summary.deliveredCount > 0

  return (
    <Tabs value={tabValue} onValueChange={setTabValue} className="space-y-6">
      <TabsList className="flex w-full flex-wrap h-auto gap-1 bg-slate-100/80 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
          Overview
        </TabsTrigger>
        <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
          Content
        </TabsTrigger>
        <TabsTrigger value="audience" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
          Audience
        </TabsTrigger>
        <TabsTrigger value="performance" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
          Performance
        </TabsTrigger>
        <TabsTrigger value="activity" className="rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800">
          Activity Log
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Campaign summary</CardTitle>
                <CardDescription>Type, channel, schedule, and lifecycle timestamps</CardDescription>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-4 text-sm">
                <SummaryRow label="Campaign type" value={campaign.type} />
                <SummaryRow label="Channel / provider" value={template.channel} />
                <SummaryRow label="Owner" value="—" />
                <SummaryRow label="Created" value={formatTs(campaign.createdAt)} />
                <SummaryRow label="Scheduled" value={formatTs(campaign.scheduledFor)} />
                <SummaryRow label="Sent at" value={formatTs(campaign.sentAt)} />
                <SummaryRow label="Last updated" value={formatTs(campaign.updatedAt)} />
                <SummaryRow label="Status" value={campaign.status} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Delivery funnel</CardTitle>
                <CardDescription>Audience → sent → delivered → engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {funnelData.map((f, i) => (
                    <div
                      key={f.name}
                      className="flex-1 min-w-[100px] rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3"
                    >
                      <div className="text-[11px] uppercase tracking-wide text-slate-500">{f.name}</div>
                      <div className="text-xl font-semibold text-slate-900 dark:text-slate-50">{f.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Audience source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <SummaryRow label="Source type" value={audience.sourceType} />
                <SummaryRow label="Source name" value={audience.sourceName} />
                <SummaryRow label="Excluded (est.)" value={String(audience.excludedCount)} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Template</CardTitle>
                <CardDescription>Inline content stored on the campaign</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <SummaryRow label="Template name" value={template.name} />
                <SummaryRow label="Version" value={template.version ?? '—'} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setTabValue('content')}
                >
                  View full content
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Quick actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
                  Export recipients
                </Button>
                <Button type="button" variant="outline" size="sm" disabled title="Coming soon">
                  Open in template editor
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="content" className="space-y-6 mt-6">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7 space-y-6">
            <Card
              className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
              data-testid="campaign-template-preview"
            >
              <CardHeader>
                <CardTitle className="text-base">Rendered preview</CardTitle>
                <CardDescription>Message body as stored for this campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-6 min-h-[200px]">
                  {contentPreview.subject && (
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                      {contentPreview.subject}
                    </p>
                  )}
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                    {contentPreview.body || (
                      <span className="text-slate-500">Template preview unavailable — no body stored.</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-5 space-y-6">
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Template metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <SummaryRow label="Name" value={template.name} />
                <SummaryRow label="Channel" value={template.channel} />
                <SummaryRow label="Version" value={template.version ?? '—'} />
                <SummaryRow label="Updated" value={formatTs(template.updatedAt)} />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Message details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <SummaryRow label="Subject / title" value={contentPreview.subject ?? '—'} />
                <SummaryRow label="Preview text" value={contentPreview.previewText ?? '—'} />
                <SummaryRow label="CTA URL" value="—" />
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Personalization variables</CardTitle>
                <CardDescription>Tokens detected in the message body</CardDescription>
              </CardHeader>
              <CardContent>
                {payload.variables.length === 0 ? (
                  <p className="text-sm text-slate-500">No <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">{'{{ }}'}</code> variables in this message.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {payload.variables.map((v) => (
                      <li
                        key={v}
                        className="text-xs font-mono rounded-md bg-violet-50 dark:bg-violet-950/50 text-violet-900 dark:text-violet-100 px-2 py-1 border border-violet-100 dark:border-violet-900"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="audience" className="space-y-6 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MiniStat title="Source audience" value={audience.validCount} />
          <MiniStat title="Excluded" value={audience.excludedCount} />
          <MiniStat title="Sendable (plan)" value={payload.summary.audienceCount} />
          <MiniStat title="Invalid (est.)" value={audience.invalidCount} />
        </div>
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1 space-y-2">
              <CardTitle className="text-base">Recipients</CardTitle>
              <CardDescription>Sample of contacts targeted by this campaign</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search name, email, phone…"
                value={audienceQuery}
                onChange={(e) => setAudienceQuery(e.target.value)}
                className="max-w-xs"
              />
              <select
                className={cn(
                  'h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-sm'
                )}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="overflow-x-auto" data-testid="campaign-audience-table">
            {filteredRecipients.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">
                {recipientsSample.length === 0
                  ? 'No recipient sample available — contacts may not be linked on this campaign record.'
                  : 'No rows match your filters.'}
              </p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email / phone</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecipients.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/80 dark:hover:bg-slate-900/50 cursor-pointer"
                      onClick={() => setDrawerRow(r)}
                    >
                      <td className="py-2.5 pr-4 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                      <td className="py-2.5 pr-4 text-slate-600 dark:text-slate-400">
                        {r.email || r.phone || '—'}
                      </td>
                      <td className="py-2.5 pr-4 capitalize">{r.status}</td>
                      <td className="py-2.5 text-right text-violet-600 dark:text-violet-400 text-xs">View</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-6 mt-6">
        {!hasPerf ? (
          <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
            <CardContent className="py-12 text-center text-sm text-slate-500" data-testid="campaign-performance-chart">
              No delivery data yet. Performance charts will populate after sends complete and stats sync.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MiniStat title="Open rate" value={`${performance.metrics.openRate.toFixed(1)}%`} />
              <MiniStat title="Click rate" value={`${performance.metrics.clickRate.toFixed(1)}%`} />
              <MiniStat title="CTR (click/open)" value={`${performance.metrics.ctr.toFixed(1)}%`} />
              <MiniStat title="Bounce rate" value={`${performance.metrics.bounceRate.toFixed(1)}%`} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Engagement snapshot" subtitle="Aggregate totals for this campaign">
                <div data-testid="campaign-performance-chart" className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { name: 'Sent', value: payload.summary.sentCount },
                        { name: 'Delivered', value: payload.summary.deliveredCount },
                        { name: 'Opened', value: campaign.opened },
                        { name: 'Clicked', value: campaign.clicked },
                      ]}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#53328A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
              <ChartCard title="Delivery breakdown" subtitle="Delivered vs failed vs pending">
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieDelivery} cx="50%" cy="50%" outerRadius={88} dataKey="value">
                        {pieDelivery.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartCard>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Failure reasons</CardTitle>
                </CardHeader>
                <CardContent>
                  {performance.failures.length === 0 ? (
                    <p className="text-sm text-slate-500">No failure breakdown recorded.</p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {performance.failures.map((f, i) => (
                        <li key={i} className="flex justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                          <span>{f.reason}</span>
                          <span className="font-medium tabular-nums">{f.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Provider (SMS)</CardTitle>
                  <CardDescription>Delivery reports by status code</CardDescription>
                </CardHeader>
                <CardContent>
                  {Object.keys(providerStats.smsByStatus).length === 0 ? (
                    <p className="text-sm text-slate-500">No SMS provider rows for this campaign.</p>
                  ) : (
                    <ul className="space-y-1 text-sm font-mono">
                      {Object.entries(providerStats.smsByStatus).map(([k, v]) => (
                        <li key={k} className="flex justify-between">
                          <span>{k}</span>
                          <span>{v}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="activity" className="space-y-6 mt-6" data-testid="campaign-activity-log">
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>System events derived from the campaign record</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLog.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No activity logs recorded yet.</p>
            ) : (
              <ol className="relative border-l border-slate-200 dark:border-slate-700 ml-2 space-y-6 pl-6">
                {activityLog.map((ev) => (
                  <li key={ev.id} className="text-sm">
                    <span
                      className={cn(
                        'absolute -left-[9px] top-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950',
                        ev.kind === 'success' && 'bg-emerald-500',
                        ev.kind === 'warning' && 'bg-amber-500',
                        ev.kind === 'error' && 'bg-red-500',
                        ev.kind === 'info' && 'bg-slate-400'
                      )}
                    />
                    <time className="text-xs text-slate-500">{formatTs(ev.at)}</time>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{ev.title}</p>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{ev.message}</p>
                    <details className="mt-2 text-xs text-slate-500">
                      <summary className="cursor-pointer select-none">Raw details</summary>
                      <pre className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 overflow-x-auto">
                        {JSON.stringify({ id: ev.id, actor: ev.actor, kind: ev.kind }, null, 2)}
                      </pre>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <Sheet open={!!drawerRow} onOpenChange={(o) => !o && setDrawerRow(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{drawerRow?.name}</SheetTitle>
            <SheetDescription>Recipient sample row — CRM deep link coming soon.</SheetDescription>
          </SheetHeader>
          {drawerRow && (
            <div className="mt-6 space-y-3 text-sm">
              <SummaryRow label="Email" value={drawerRow.email ?? '—'} />
              <SummaryRow label="Phone" value={drawerRow.phone ?? '—'} />
              <SummaryRow label="Status" value={drawerRow.status} />
              <p className="text-xs text-slate-500 pt-4">
                Per-recipient delivery events are not stored on this campaign yet. Use CRM contact for full history.
              </p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </Tabs>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-medium text-slate-900 dark:text-slate-100 break-words">{value}</div>
    </div>
  )
}

function MiniStat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/40 px-4 py-3 shadow-sm">
      <div className="text-[11px] uppercase tracking-wide text-slate-500">{title}</div>
      <div className="text-lg font-semibold text-slate-900 dark:text-slate-50">{typeof value === 'number' ? value.toLocaleString() : value}</div>
    </div>
  )
}
