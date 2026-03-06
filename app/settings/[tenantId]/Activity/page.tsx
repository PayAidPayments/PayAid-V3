'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity } from 'lucide-react'

interface AuditEntry {
  id: string
  entityType: string
  entityId: string
  changeSummary: string
  changedBy: string
  before: unknown
  after: unknown
  timestamp: string
}

export default function SettingsActivityPage() {
  const params = useParams()
  const tenantId = params.tenantId as string
  const { token } = useAuthStore()
  const [logs, setLogs] = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId || !token) return
    setLoading(true)
    fetch(`/api/audit-logs?tenantId=${encodeURIComponent(tenantId)}&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((data) => setLogs(data.logs ?? []))
      .finally(() => setLoading(false))
  }, [tenantId, token])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Activity</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Read-only audit log of key actions in Finance and HR
        </p>
      </div>
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Activity className="w-5 h-5" />
            Audit log
          </CardTitle>
          <CardDescription>Recent create, update, and approval events</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No activity recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Time</th>
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Action</th>
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">Entity</th>
                    <th className="text-left py-2 font-medium text-slate-700 dark:text-slate-300">By</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="py-2 text-slate-600 dark:text-slate-400">
                        {new Date(l.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2 text-slate-900 dark:text-slate-100">{l.changeSummary}</td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">
                        {l.entityType} {l.entityId.slice(0, 8)}
                      </td>
                      <td className="py-2 text-slate-600 dark:text-slate-400">{l.changedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
