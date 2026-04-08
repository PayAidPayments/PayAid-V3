'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type AuditAction = {
  id: string
  kind?: 'audit' | 'signal'
  entity_type: string
  entity_id: string
  changed_by: string
  summary: string
  timestamp: string
}

type Props = {
  entityType: 'deal' | 'contact'
  entityId: string
  title?: string
}

export function AuditActionTimelineCard({ entityType, entityId, title = 'Automation & Audit Timeline' }: Props) {
  const { token } = useAuthStore()
  const [actions, setActions] = useState<AuditAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setLoading(true)
        setError(null)
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined
        const [auditResponse, signalResponse] = await Promise.all([
          fetch(
            `/api/v1/audit/actions?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}&limit=50`,
            { headers }
          ),
          fetch(`/api/v1/signals?entityType=${encodeURIComponent(entityType)}&limit=100`, { headers }),
        ])

        if (!auditResponse.ok) {
          throw new Error('Failed to fetch audit timeline')
        }
        const auditJson = await auditResponse.json()
        const signalJson = signalResponse.ok ? await signalResponse.json().catch(() => ({})) : {}
        const auditRows = Array.isArray(auditJson.actions) ? auditJson.actions : []
        const signalRows = Array.isArray(signalJson.signals) ? signalJson.signals : []
        const mappedSignals: AuditAction[] = signalRows
          .filter((item: any) => item.entity_id === entityId)
          .map((item: any) => ({
            id: item.event_id,
            kind: 'signal',
            entity_type: item.entity_type,
            entity_id: item.entity_id,
            changed_by: 'system',
            summary: `Signal detected: ${item.event_type}`,
            timestamp: item.occurred_at,
          }))

        const combined = [...auditRows, ...mappedSignals].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        if (!active) return
        setActions(combined)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Failed to fetch audit timeline')
      } finally {
        if (active) setLoading(false)
      }
    }

    if (token && entityId) {
      void load()
    } else {
      setLoading(false)
    }

    return () => {
      active = false
    }
  }, [entityType, entityId, token])

  return (
    <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-indigo-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-slate-500">Loading timeline...</p>
        ) : error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
            {error}
          </div>
        ) : actions.length === 0 ? (
          <div className="rounded-lg border border-slate-200/80 dark:border-slate-700 px-3 py-4 text-sm text-slate-500">
            No automation activity yet for this record. Trigger a workflow or sequence to see actions here.
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-auto pr-1">
            {actions.map((action) => (
              <div key={action.id} className="rounded-lg border border-slate-200/80 dark:border-slate-700 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{action.summary}</p>
                  <Badge variant="outline" className="capitalize text-[10px]">
                    {action.kind === 'signal' ? 'signal' : action.entity_type}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
