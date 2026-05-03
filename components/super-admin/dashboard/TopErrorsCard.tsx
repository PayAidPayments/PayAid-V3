'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, ExternalLink } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface ErrorType {
  type: string
  count: number
  percentage: number
}

interface TopErrorsCardProps {
  errors?: ErrorType[]
  loading?: boolean
}

export function TopErrorsCard({ errors, loading }: TopErrorsCardProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!errors || errors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Error Types</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No errors in the last 24h</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Top 5 Error Types</CardTitle>
        <Link href="/super-admin/operations/system">
          <Button variant="ghost" size="sm">
            View All
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.slice(0, 5).map((error, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{error.type}</p>
                  <p className="text-xs text-muted-foreground">{error.count} occurrences</p>
                </div>
              </div>
              <div className="text-sm font-medium text-red-600">{error.percentage}%</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
