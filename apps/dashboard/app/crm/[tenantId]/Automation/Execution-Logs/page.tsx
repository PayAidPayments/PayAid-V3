'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Fragment, useCallback, useEffect, useState } from 'react'
import { getAuthHeaders } from '@/lib/hooks/use-api'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageLoading } from '@/components/ui/loading'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { format as formatDate } from 'date-fns'
import { ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'

type PilotMetrics = {
  windowHours: number
  since: string
  routingDecisions: number
  deadLetters: number
  idempotencyRows: number
  pilotFirstTasksLinked: number
  orchestrationLogs: number
}

type OrchestrationLogRow = {
  id: string
  contactId: string | null
  status: string
  sourceChannel: string
  dedupeAction: string | null
  leadScore: number | null
  contactCreated: boolean
  trace: unknown
  errorCode: string | null
  errorMessage: string | null
  actorUserId: string
  createdAt: string
}

export default function ExecutionLogsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string
  const [logs, setLogs] = useState<OrchestrationLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<PilotMetrics | null>(null)
  const [metricsError, setMetricsError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    setMetricsError(null)
    try {
      const [logRes, metricsRes] = await Promise.all([
        fetch(
          `/api/crm/inbound-orchestration/logs?tenantId=${encodeURIComponent(tenantId)}&limit=50`,
          { headers: getAuthHeaders() }
        ),
        fetch(
          `/api/crm/inbound-pilot/metrics?tenantId=${encodeURIComponent(tenantId)}&hours=24`,
          { headers: getAuthHeaders() }
        ),
      ])
      const json = await logRes.json().catch(() => ({}))
      if (!logRes.ok) {
        setError(json?.error || 'Failed to load execution logs')
        setLogs([])
      } else {
        setLogs(Array.isArray(json.logs) ? json.logs : [])
      }
      const mj = await metricsRes.json().catch(() => ({}))
      if (!metricsRes.ok) {
        setMetrics(null)
        setMetricsError(typeof mj?.error === 'string' ? mj.error : 'Failed to load pilot metrics')
      } else if (mj && typeof mj.routingDecisions === 'number') {
        setMetrics(mj as PilotMetrics)
      } else {
        setMetrics(null)
        setMetricsError('Unexpected metrics response')
      }
    } catch {
      setError('Failed to load execution logs')
      setLogs([])
      setMetricsError('Failed to load pilot metrics')
      setMetrics(null)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="max-w-7xl mx-auto w-full px-4 py-5 space-y-4">
        <nav className="flex flex-wrap items-center gap-3">
          <Link
            href={`/crm/${tenantId}/Automation`}
            className="text-xs font-medium text-violet-700 hover:underline dark:text-violet-300"
          >
            ← CRM automation
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Refresh
          </Button>
        </nav>

        <header className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Execution logs</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Recent runs of the inbound orchestration pipeline: source, dedupe outcome, score, and step trace.
            Rows appear after contacts are created or merged through wired entry points (forms, API, deals,
            chatbots, imports, and so on).
          </p>
        </header>

        {metricsError ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            Pilot metrics unavailable: {metricsError}
          </div>
        ) : null}

        {metrics ? (
          <Card className="rounded-2xl border-slate-200/80 shadow-sm dark:border-slate-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Inbound pilot (last {metrics.windowHours}h)</CardTitle>
              <CardDescription>
                Counters for routing decisions, orchestration logs, idempotency keys, first-follow-up tasks
                linked from decisions, and dead letters. Configure SLA / guarantee on{' '}
                <Link
                  href={`/crm/${tenantId}/Automation/Lead-Routing`}
                  className="text-violet-700 hover:underline dark:text-violet-300"
                >
                  Lead routing
                </Link>
                .
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  { label: 'Routing decisions', value: metrics.routingDecisions },
                  { label: 'Orchestration logs', value: metrics.orchestrationLogs },
                  { label: 'Idempotency rows', value: metrics.idempotencyRows },
                  { label: 'Pilot first tasks', value: metrics.pilotFirstTasksLinked },
                  { label: 'Dead letters', value: metrics.deadLetters },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/50"
                  >
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {m.label}
                    </p>
                    <p className="text-2xl font-semibold tabular-nums">{m.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">Since {metrics.since}</p>
            </CardContent>
          </Card>
        ) : null}

        {loading && logs.length === 0 ? (
          <PageLoading message="Loading execution logs…" fullScreen={false} />
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            No orchestration runs recorded yet. Submit a PayAid form with auto-create contact, create a contact
            from CRM, or use another wired path; then refresh this page.
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead className="whitespace-nowrap">Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Dedupe</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>New</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((row) => {
                  const open = expandedId === row.id
                  return (
                    <Fragment key={row.id}>
                      <TableRow
                        className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/80"
                        onClick={() => setExpandedId(open ? null : row.id)}
                      >
                        <TableCell className="w-8 p-2">
                          {open ? (
                            <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden />
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(new Date(row.createdAt), 'yyyy-MM-dd HH:mm')}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{row.status}</TableCell>
                        <TableCell className="text-xs">{row.sourceChannel}</TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {row.dedupeAction ?? '—'}
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {row.leadScore != null ? row.leadScore : '—'}
                        </TableCell>
                        <TableCell className="text-xs">{row.contactCreated ? 'Yes' : 'No'}</TableCell>
                        <TableCell className="text-xs">
                          {row.contactId ? (
                            <Link
                              href={`/crm/${tenantId}/Contacts/${row.contactId}`}
                              className="text-violet-700 hover:underline dark:text-violet-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open
                            </Link>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-xs text-red-700 dark:text-red-300">
                          {row.errorCode || row.errorMessage || '—'}
                        </TableCell>
                      </TableRow>
                      {open ? (
                        <TableRow className="bg-slate-50 dark:bg-slate-800/50">
                          <TableCell colSpan={9} className="p-4">
                            <p className="mb-2 text-xs font-medium text-slate-700 dark:text-slate-300">
                              Step trace (actor: {row.actorUserId})
                            </p>
                            <pre className="max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white p-3 text-[11px] leading-relaxed dark:border-slate-700 dark:bg-slate-950">
                              {JSON.stringify(row.trace, null, 2)}
                            </pre>
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
