'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

type AuditRow = {
  id: string
  action: string
  actorId: string
  resourceType: string
  createdAt: string
}

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/audit-log')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => setLogs(j.data ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Audit log</h1>
        <p className="text-muted-foreground">Actor, action, resource, timestamp</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent events</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit events yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map((l) => (
                <div key={l.id} className="flex items-center justify-between py-2 border-b text-sm">
                  <span>{l.action}</span>
                  <span className="text-muted-foreground">{new Date(l.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
