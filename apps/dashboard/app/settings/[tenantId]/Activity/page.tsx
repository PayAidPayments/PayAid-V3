'use client'

import { useParams } from 'next/navigation'
import { useMemo, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { Activity, Filter, RefreshCcw, ChevronDown, ChevronUp } from 'lucide-react'

interface AuditEntry {
  id: string
  action: string
  dataType: string
  entityId?: string | null
  summary: string
  userId?: string | null
  userEmail?: string | null
  before?: unknown
  after?: unknown
  createdAt: string
}

export default function SettingsActivityPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [action, setAction] = useState('')
  const [dataType, setDataType] = useState('')
  const [userId, setUserId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  const queryString = useMemo(() => {
    const sp = new URLSearchParams()
    sp.set('limit', '200')
    if (action.trim()) sp.set('action', action.trim())
    if (dataType.trim()) sp.set('dataType', dataType.trim())
    if (userId.trim()) sp.set('userId', userId.trim())
    if (startDate.trim()) sp.set('startDate', startDate.trim())
    if (endDate.trim()) sp.set('endDate', endDate.trim())
    return sp.toString()
  }, [action, dataType, userId, startDate, endDate])

  const { data, isLoading, error, isFetching, refetch } = useQuery({
    queryKey: ['settings', 'audit-logs', tenantId, queryString],
    queryFn: async () => {
      const res = await fetch(`/api/compliance/audit-logs?${queryString}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Failed to load audit logs')
      return json as { logs: AuditEntry[]; count: number }
    },
    enabled: Boolean(tenantId && token),
  })

  const logs = data?.logs ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Activity</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Read-only audit log of key actions across modules
        </p>
      </div>
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Activity className="w-5 h-5" />
            Audit log
          </CardTitle>
          <CardDescription>Filter, review changes, and export for audits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <Filter className="w-4 h-4" />
              Filters
            </div>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Action</div>
                <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. invoice.send" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Data type</div>
                <Input value={dataType} onChange={(e) => setDataType(e.target.value)} placeholder="e.g. invoice" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">User ID</div>
                <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">Start</div>
                <Input value={startDate} onChange={(e) => setStartDate(e.target.value)} type="date" />
              </div>
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500 dark:text-slate-400">End</div>
                <Input value={endDate} onChange={(e) => setEndDate(e.target.value)} type="date" />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Showing up to 200 events. Refine filters for narrower audits.
              </div>
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
              {error instanceof Error ? error.message : 'Failed to load audit logs'}
            </div>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>By</TableHead>
                    <TableHead className="text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((l) => {
                    const expanded = Boolean(expandedIds[l.id])
                    return (
                      <>
                        <TableRow key={l.id}>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {new Date(l.createdAt).toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-slate-900 dark:text-slate-100">
                            <div className="font-medium">{l.summary || l.action}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{l.action}</div>
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            <Badge variant="secondary" className="rounded-full mr-2">{l.dataType}</Badge>
                            {l.entityId ? String(l.entityId).slice(0, 10) : '—'}
                          </TableCell>
                          <TableCell className="text-slate-600 dark:text-slate-400">
                            {l.userEmail || l.userId || '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedIds((p) => ({ ...p, [l.id]: !expanded }))}
                            >
                              {expanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                              {expanded ? 'Hide' : 'View'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        {expanded && (
                          <TableRow key={`${l.id}-details`}>
                            <TableCell colSpan={5}>
                              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4 text-xs overflow-auto">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">Before</div>
                                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(l.before ?? null, null, 2)}</pre>
                                  </div>
                                  <div>
                                    <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-2">After</div>
                                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(l.after ?? null, null, 2)}</pre>
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {isFetching && !isLoading && (
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">Refreshing…</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
