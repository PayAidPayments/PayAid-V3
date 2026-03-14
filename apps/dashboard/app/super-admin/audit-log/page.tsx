'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, Search, Download } from 'lucide-react'

interface LogRow {
  id: string
  entityType: string
  entityId: string
  changedBy: string
  changeSummary: string
  tenantId: string
  tenantName: string
  ipAddress?: string | null
  userAgent?: string | null
  timestamp: string
}

export default function SuperAdminAuditLogPage() {
  const [logs, setLogs] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [entityType, setEntityType] = useState('')
  const [tenantId, setTenantId] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [entityType, tenantId])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (entityType) params.set('entityType', entityType)
      if (tenantId) params.set('tenantId', tenantId)
      params.set('limit', '100')
      const res = await fetch(`/api/super-admin/audit-log?${params}`)
      if (res.ok) {
        const json = await res.json()
        setLogs(json.data || [])
      } else setLogs([])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const exportCsv = () => {
    const headers = ['Timestamp', 'Tenant', 'Entity Type', 'Entity ID', 'Changed By', 'Summary']
    const rows = logs.map((l) => [
      l.timestamp,
      l.tenantName,
      l.entityType,
      l.entityId,
      l.changedBy,
      `"${(l.changeSummary || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit Log</h1>
          <p className="text-muted-foreground">
            Platform-wide activity. Filter by tenant or entity type and export for compliance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={logs.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Tenant ID (optional)"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
          className="max-w-[200px]"
        />
        <Input
          placeholder="Entity type (optional)"
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="max-w-[200px]"
        />
        <Button onClick={fetchLogs}>
          <Search className="h-4 w-4 mr-2" /> Apply
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="mb-2">No audit logs match the filters.</p>
              <p className="text-sm">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {logs.map((l) => (
                <div key={l.id} className="flex flex-wrap items-start gap-2 p-3 rounded-lg border text-sm">
                  <span className="text-muted-foreground shrink-0">
                    {new Date(l.timestamp).toLocaleString()}
                  </span>
                  <span className="font-medium">{l.tenantName}</span>
                  <span className="text-muted-foreground">{l.entityType}</span>
                  <span className="text-muted-foreground">· {l.changedBy}</span>
                  {l.ipAddress && (
                    <span className="text-xs text-muted-foreground">IP: {l.ipAddress}</span>
                  )}
                  <span className="w-full">{l.changeSummary}</span>
                  {l.userAgent && (
                    <span className="text-xs text-muted-foreground w-full truncate">
                      {l.userAgent}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
