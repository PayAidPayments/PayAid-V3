'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface SAAIUsageChartProps {
  data?: { label: string; value: number }[]
  loading?: boolean
}

export function SAAIUsageChart({ data = [], loading }: SAAIUsageChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI usage</CardTitle>
        <p className="text-sm text-muted-foreground">Recent AI usage metrics</p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No usage data yet</p>
        ) : (
          <ul className="space-y-2">
            {data.map((d) => (
              <li
                key={d.label}
                className="flex justify-between text-sm"
              >
                <span>{d.label}</span>
                <span className="font-medium">{d.value.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
