'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TenantUsageCardProps {
  userCount?: number
  maxUsers?: number
  usageSummary?: string
}

export function TenantUsageCard({
  userCount = 0,
  maxUsers = 1,
  usageSummary,
}: TenantUsageCardProps) {
  const pct = maxUsers ? Math.round((userCount / maxUsers) * 100) : 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Users</span>
          <span>{userCount} / {maxUsers} ({pct}%)</span>
        </div>
        {usageSummary && (
          <p className="text-sm text-muted-foreground">{usageSummary}</p>
        )}
      </CardContent>
    </Card>
  )
}