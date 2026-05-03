'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle } from 'lucide-react'

interface AnomalyRow {
  tenantId: string
  tenantName?: string
  type: string
  description: string
}

interface SAAnomaliesCardProps {
  items?: AnomalyRow[]
  loading?: boolean
}

export function SAAnomaliesCard({ items = [], loading }: SAAnomaliesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4" />
          AI anomalies
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Unusual API usage, failed logins, or suspicious RBAC changes
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No anomalies detected</p>
        ) : (
          <ul className="space-y-2">
            {items.map((a, i) => (
              <li key={a.tenantId + i} className="flex items-center justify-between text-sm">
                <span>{a.tenantName ?? a.tenantId}</span>
                <Badge variant="secondary">{a.type}</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
