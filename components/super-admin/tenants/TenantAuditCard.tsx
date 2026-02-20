'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TenantAuditCardProps {
  recentEvents?: { action: string; at: string }[]
}

export function TenantAuditCard({ recentEvents = [] }: TenantAuditCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {recentEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {recentEvents.map((e, i) => (
              <li key={i} className="flex justify-between">
                <span>{e.action}</span>
                <span className="text-muted-foreground">{e.at}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}