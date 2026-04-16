'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth'
import { useQuery } from '@tanstack/react-query'
import { Activity, Bot, Filter, RefreshCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CopyAction } from '@/components/ui/copy-action'

interface SpecialistEvent {
  eventType: string
  specialistId: string
  specialistName: string
  module: string
  actionLevel: 'read' | 'draft' | 'guarded_write' | 'restricted'
  sessionId: string
  prompt: string
  permissionResult: 'granted' | 'denied'
  reason?: string
  result?: 'success' | 'blocked' | 'error'
  latencyMs?: number
}

interface SpecialistActivityRow {
  id: string
  timestamp: string
  changedBy: string
  event: SpecialistEvent
}

type ActivitySource = 'specialist_table' | 'legacy_audit'

function levelBadgeVariant(level: SpecialistEvent['actionLevel']): 'default' | 'secondary' | 'outline' | 'destructive' {
  if (level === 'restricted') return 'destructive'
  if (level === 'guarded_write') return 'default'
  if (level === 'draft') return 'secondary'
  return 'outline'
}

export default function AgentActivitySettingsPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()

  const [specialistId, setSpecialistId] = useState('')
  const [module, setModule] = useState('')
  const [actionLevel, setActionLevel] = useState('')
  const [result, setResult] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set('limit', '100')
    if (specialistId.trim()) sp.set('specialistId', specialistId.trim())
    if (module.trim()) sp.set('module', module.trim())
    if (actionLevel.trim()) sp.set('actionLevel', actionLevel.trim())
    if (result.trim()) sp.set('result', result.trim())
    if (startDate.trim()) sp.set('startDate', startDate.trim())
    if (endDate.trim()) sp.set('endDate', endDate.trim())
    return sp.toString()
  }, [actionLevel, endDate, module, result, specialistId, startDate])

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['settings', 'agent-activity', tenantId, queryString],
    queryFn: async () => {
      const response = await fetch(`/api/ai/specialists/activity?${queryString}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      const json = (await response.json().catch(() => ({}))) as {
        activity?: SpecialistActivityRow[]
        source?: ActivitySource
        migrationReady?: boolean
        fallbackReason?: string | null
        runbookPath?: string
        recommendedCommands?: string[]
        error?: string
      }
      if (!response.ok) throw new Error(json.error || 'Failed to load specialist activity')
      return json
    },
    enabled: Boolean(tenantId && token),
  })

  const rows = useMemo(() => data?.activity ?? [], [data?.activity])
  const source = data?.source
  const migrationReady = data?.migrationReady
  const fallbackReason = data?.fallbackReason
  const runbookPath = data?.runbookPath
  const recommendedCommands = data?.recommendedCommands ?? []
  const analytics = useMemo(() => {
    const total = rows.length
    const blocked = rows.filter((row) => (row.event.result || row.event.permissionResult) === 'blocked' || row.event.permissionResult === 'denied').length
    const blockedRate = total > 0 ? (blocked / total) * 100 : 0

    const specialistCounts = rows.reduce<Record<string, { id: string; count: number }>>((acc, row) => {
      const key = row.event.specialistName || row.event.specialistId || 'Unknown specialist'
      if (!acc[key]) {
        acc[key] = { id: row.event.specialistId, count: 0 }
      }
      acc[key].count += 1
      return acc
    }, {})

    const moduleCounts = rows.reduce<Record<string, number>>((acc, row) => {
      const key = row.event.module || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

    const topSpecialistEntry = Object.entries(specialistCounts).sort((a, b) => b[1].count - a[1].count)[0]
    const topModuleEntry = Object.entries(moduleCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      total,
      blocked,
      blockedRate,
      topSpecialistName: topSpecialistEntry?.[0] || '—',
      topSpecialistId: topSpecialistEntry?.[1]?.id || '',
      topSpecialistCount: topSpecialistEntry?.[1]?.count || 0,
      topModule: topModuleEntry?.[0] || '—',
      topModuleCount: topModuleEntry?.[1] || 0,
    }
  }, [rows])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Agent Activity</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Track specialist prompts, policy checks, and outcomes across your workspace.
        </p>
      </div>

      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Activity className="w-5 h-5" />
            Specialist event feed
          </CardTitle>
          <CardDescription className="flex items-center gap-2">
            <span>Audit view for specialist interactions and approvals.</span>
            {source ? (
              <Badge variant={source === 'specialist_table' ? 'outline' : 'secondary'}>
                Source: {source === 'specialist_table' ? 'Specialist table' : 'Legacy audit fallback'}
              </Badge>
            ) : null}
            {source === 'legacy_audit' && fallbackReason ? (
              <Badge variant="secondary">Reason: {fallbackReason}</Badge>
            ) : null}
            {typeof migrationReady === 'boolean' ? (
              <Badge variant={migrationReady ? 'outline' : 'secondary'}>
                {migrationReady ? 'Migration ready' : 'Migration pending'}
              </Badge>
            ) : null}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {migrationReady === false && (
            <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 text-sm text-amber-800 dark:text-amber-200">
              <div className="font-medium">Migration runbook needed</div>
              <p className="mt-1 text-xs">
                Specialist activity is currently using legacy fallback. Apply migration and regenerate Prisma client.
              </p>
              <div className="mt-2 text-xs">
                <span className="font-semibold">Runbook:</span>{' '}
                <code className="rounded bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5">{runbookPath || 'docs/ai/specialist-activity-migration-runbook.md'}</code>
              </div>
              {recommendedCommands.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold">Recommended commands</div>
                    <div className="flex items-center gap-2">
                      <CopyAction
                        textToCopy={() => recommendedCommands.join('\n')}
                        successMessage="Commands copied to clipboard."
                        label="Copy commands"
                        copiedLabel="Copied"
                        buttonProps={{ variant: 'outline', size: 'sm', className: 'h-7 px-2 text-[11px]' }}
                        showFeedback={false}
                      />
                      <CopyAction
                        textToCopy={() =>
                          [
                            'Specialist Activity Migration',
                            `Runbook: ${runbookPath || 'docs/ai/specialist-activity-migration-runbook.md'}`,
                            '',
                            ...recommendedCommands,
                          ].join('\n')
                        }
                        successMessage="Support snippet copied to clipboard."
                        label="Copy support snippet"
                        copiedLabel="Copied"
                        buttonProps={{ variant: 'outline', size: 'sm', className: 'h-7 px-2 text-[11px]' }}
                        showFeedback={false}
                      />
                    </div>
                  </div>
                  <div className="mt-1 rounded-lg border border-amber-200 dark:border-amber-900 bg-white/70 dark:bg-black/20 p-2">
                    {recommendedCommands.map((command) => (
                      <code key={command} className="block text-xs leading-5">{command}</code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardDescription>Total activity (current view)</CardDescription>
                <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">{analytics.total}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardDescription>Blocked-action rate</CardDescription>
                <CardTitle className="text-2xl text-slate-900 dark:text-slate-100">
                  {analytics.blockedRate.toFixed(1)}%
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-500 dark:text-slate-400">
                {analytics.blocked} of {analytics.total || 0} events blocked/denied
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardDescription>Top specialist</CardDescription>
                <CardTitle className="text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                  {analytics.topSpecialistName}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-500 dark:text-slate-400">
                {analytics.topSpecialistCount > 0
                  ? `${analytics.topSpecialistCount} events · ${analytics.topSpecialistId}`
                  : 'No activity'}
              </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <CardDescription>Top module</CardDescription>
                <CardTitle className="text-base text-slate-900 dark:text-slate-100 capitalize">
                  {analytics.topModule}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-slate-500 dark:text-slate-400">
                {analytics.topModuleCount > 0 ? `${analytics.topModuleCount} events` : 'No activity'}
              </CardContent>
            </Card>
          </div>

          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Filter className="w-4 h-4" />
              Filters
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Specialist</div>
                <Input value={specialistId} onChange={(e) => setSpecialistId(e.target.value)} placeholder="sales-copilot" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Module</div>
                <Input value={module} onChange={(e) => setModule(e.target.value)} placeholder="crm" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Action level</div>
                <Input value={actionLevel} onChange={(e) => setActionLevel(e.target.value)} placeholder="read/draft/..." />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Result</div>
                <Input value={result} onChange={(e) => setResult(e.target.value)} placeholder="success/blocked/error" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Start</div>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">End</div>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="text-xs text-slate-500 dark:text-slate-400">Showing up to 100 rows.</div>
              <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : error ? (
            <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              {error instanceof Error ? error.message : 'Failed to load specialist activity'}
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No specialist activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Specialist</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Prompt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {new Date(row.timestamp).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2 font-medium">
                          <Bot className="w-4 h-4 text-slate-500" />
                          {row.event.specialistName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{row.event.specialistId}</div>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{row.event.module}</TableCell>
                      <TableCell>
                        <Badge variant={levelBadgeVariant(row.event.actionLevel)}>{row.event.actionLevel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.event.result === 'error' ? 'destructive' : row.event.result === 'blocked' ? 'secondary' : 'outline'}>
                          {row.event.result || row.event.permissionResult}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[420px]">
                        <div className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2">{row.event.prompt}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {row.event.reason || `Session ${row.event.sessionId.slice(0, 8)}...`}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

