'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface SAModuleAdoptionChartProps {
  data?: { module: string; tenants: number }[]
  loading?: boolean
}

export function SAModuleAdoptionChart({
  data = [],
  loading,
}: SAModuleAdoptionChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Module adoption</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const max = Math.max(...data.map((d) => d.tenants), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Module adoption</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tenants per module (from licensed modules)
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data yet</p>
          ) : (
            data.slice(0, 10).map((d) => (
              <div key={d.module} className="flex items-center gap-4">
                <span className="w-32 truncate text-sm">{d.module}</span>
                <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded"
                    style={{ width: `${(d.tenants / max) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-8">{d.tenants}</span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
