'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, Eye, MousePointerClick, UserX, AlertCircle, TrendingUp } from 'lucide-react'

interface CampaignMetrics {
  totalSent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  unsubscribed: number
  recipientCount: number
}

interface CampaignAnalyticsProps {
  campaignId: string
  metrics: CampaignMetrics
}

export function CampaignAnalytics({ campaignId, metrics }: CampaignAnalyticsProps) {
  const deliveryRate = metrics.recipientCount > 0 ? (metrics.delivered / metrics.recipientCount) * 100 : 0
  const openRate = metrics.recipientCount > 0 ? (metrics.opened / metrics.recipientCount) * 100 : 0
  const clickRate = metrics.recipientCount > 0 ? (metrics.clicked / metrics.recipientCount) * 100 : 0
  const bounceRate = metrics.recipientCount > 0 ? (metrics.bounced / metrics.recipientCount) * 100 : 0
  const unsubscribeRate = metrics.recipientCount > 0 ? (metrics.unsubscribed / metrics.recipientCount) * 100 : 0

  const stats = [
    {
      label: 'Total Sent',
      value: metrics.totalSent,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Delivered',
      value: metrics.delivered,
      percentage: deliveryRate.toFixed(1) + '%',
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Opened',
      value: metrics.opened,
      percentage: openRate.toFixed(1) + '%',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Clicked',
      value: metrics.clicked,
      percentage: clickRate.toFixed(1) + '%',
      icon: MousePointerClick,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Bounced',
      value: metrics.bounced,
      percentage: bounceRate.toFixed(1) + '%',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      label: 'Unsubscribed',
      value: metrics.unsubscribed,
      percentage: unsubscribeRate.toFixed(1) + '%',
      icon: UserX,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
              {stat.percentage && (
                <p className="text-xs text-muted-foreground mt-1">{stat.percentage}</p>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
