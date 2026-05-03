'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText, Receipt, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { format } from 'date-fns'
import { useAuthStore } from '@/lib/stores/auth'

type AuditEntry = {
  id: string
  entityType: string
  entityId: string
  changeSummary: string
  changedBy: string
  timestamp: string
  beforeSnapshot?: Record<string, unknown> | null
  afterSnapshot?: Record<string, unknown> | null
}

export default function HRAuditLogPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [entityFilter, setEntityFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId || !token) return
    setLoading(true)
    const url = new URL('/api/hr/audit-logs', window.location.origin)
    url.searchParams.set('limit', '100')
    if (entityFilter) url.searchParams.set('entityType', entityFilter)
    fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((data) => setLogs(data.logs || []))
      .finally(() => setLoading(false))
  }, [tenantId, token, entityFilter])

  return (
    <div className="space-y-5 pb-24">
      <div className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-slate-50/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/hr/${tenantId}`} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 p-1">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Audit Log</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Payroll and contract changes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 text-sm px-3 py-2"
            >
              <option value="">All</option>
              <option value="PayrollRun">Payroll</option>
              <option value="Contract">Contract</option>
            </select>
            <Badge variant="secondary" className="text-xs">{logs.length} entries</Badge>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-slate-900 dark:text-slate-50">Recent changes</CardTitle>
          <CardDescription className="text-xs">Who changed what and when</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-slate-500 dark:text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No audit entries yet</p>
              <p className="text-sm mt-1">Payroll run edits and contract updates will appear here.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="border-b border-slate-200 dark:border-slate-800 last:border-0"
                >
                  <div
                    className="flex flex-wrap items-start justify-between gap-2 py-3 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {log.entityType === 'PayrollRun' ? (
                        <Receipt className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                      ) : (
                        <FileText className="h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-slate-50 text-sm">{log.changeSummary}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {log.entityType} · {log.entityId.slice(0, 12)}… · by {log.changedBy}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">
                        {log.entityType}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {format(new Date(log.timestamp), 'MMM d, HH:mm')}
                      </span>
                      {(log.beforeSnapshot || log.afterSnapshot) &&
                        (expandedId === log.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />)}
                    </div>
                  </div>
                  {expandedId === log.id && (log.beforeSnapshot || log.afterSnapshot) && (
                    <div className="pb-3 pl-6 pr-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-800/30 rounded-b-lg">
                      {log.beforeSnapshot && (
                        <div>
                          <p className="font-medium text-slate-500 dark:text-slate-400 mb-1">Before</p>
                          <pre className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            {JSON.stringify(log.beforeSnapshot, null, 2)}
                          </pre>
                        </div>
                      )}
                      {log.afterSnapshot && (
                        <div>
                          <p className="font-medium text-slate-500 dark:text-slate-400 mb-1">After</p>
                          <pre className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            {JSON.stringify(log.afterSnapshot, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
