'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Flag, CreditCard, Settings, AlertCircle, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'

interface Change {
  type: 'feature_flag' | 'plan_change' | 'settings' | 'alert'
  title: string
  description: string
  timestamp: string
  href?: string
}

interface RecentChangesFeedProps {
  changes?: Change[]
  loading?: boolean
}

export function RecentChangesFeed({ changes, loading }: RecentChangesFeedProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getIcon = (type: Change['type']) => {
    switch (type) {
      case 'feature_flag':
        return Flag
      case 'plan_change':
        return CreditCard
      case 'settings':
        return Settings
      case 'alert':
        return AlertCircle
      default:
        return Clock
    }
  }

  const getColor = (type: Change['type']) => {
    switch (type) {
      case 'feature_flag':
        return 'text-purple-600'
      case 'plan_change':
        return 'text-blue-600'
      case 'settings':
        return 'text-gray-600'
      case 'alert':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  if (!changes || changes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Major Changes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No recent changes</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Major Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {changes.map((change, idx) => {
            const Icon = getIcon(change.type)
            const color = getColor(change.type)
            const content = (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <Icon className={`h-5 w-5 ${color} shrink-0 mt-0.5`} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{change.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{change.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(change.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            )

            return change.href ? (
              <Link key={idx} href={change.href}>
                {content}
              </Link>
            ) : (
              <div key={idx}>{content}</div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
