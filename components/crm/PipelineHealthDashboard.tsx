'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Activity, AlertTriangle, TrendingUp, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface PipelineHealthData {
  projectedCloseRate: number
  lastMonthCloseRate: number
  stuckDeals: {
    count: number
    deals: Array<{ id: string; name: string; stage: string; daysStuck: number }>
  }
  readyToMove: {
    count: number
    deals: Array<{ id: string; name: string; currentStage: string; nextStage: string }>
  }
  recommendedActions: string[]
  riskLevel: 'low' | 'medium' | 'high'
}

export function PipelineHealthDashboard() {
  const {
    data,
    isLoading,
    isError,
  } = useQuery<{ data: PipelineHealthData }, Error>({
    queryKey: ['pipelineHealth'],
    queryFn: () =>
      apiRequest('/api/crm/analytics/pipeline-health').then((res) => res.json()),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Health</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Health</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500 text-sm">
          <AlertTriangle className="inline-block h-4 w-4 mr-1" /> Failed to load pipeline health.
        </CardContent>
      </Card>
    )
  }

  const health = data.data
  const closeRateChange = health.projectedCloseRate - health.lastMonthCloseRate

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-green-600 bg-green-100'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Pipeline Health</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Close Rate Comparison */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Projected Close Rate</span>
            <span className="text-sm font-bold text-blue-600">{health.projectedCloseRate}%</span>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Last Month</span>
            <span className="text-xs text-muted-foreground">{health.lastMonthCloseRate}%</span>
          </div>
          <Progress value={health.projectedCloseRate} className="h-2 mb-2" />
          <div className="flex items-center text-xs">
            {closeRateChange >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-600" />
            ) : (
              <TrendingUp className="h-3 w-3 mr-1 text-red-600 rotate-180" />
            )}
            <span className={closeRateChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {closeRateChange >= 0 ? '+' : ''}
              {closeRateChange.toFixed(1)}% vs last month
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Risk Level */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Risk Level</span>
            <Badge className={getRiskColor(health.riskLevel)}>
              {health.riskLevel.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Stuck Deals */}
        {health.stuckDeals.count > 0 && (
          <div className="mb-4 p-3 bg-orange-50 rounded-md">
            <div className="flex items-center mb-2">
              <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
              <span className="text-sm font-semibold text-orange-600">
                {health.stuckDeals.count} Deal{health.stuckDeals.count > 1 ? 's' : ''} Stuck
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Deals with no activity for &gt;14 days
            </p>
            {health.stuckDeals.deals.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {health.stuckDeals.deals.slice(0, 3).map((deal) => (
                  <li key={deal.id}>
                    • {deal.name} ({deal.stage}) - {deal.daysStuck} days
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Ready to Move */}
        {health.readyToMove.count > 0 && (
          <div className="mb-4 p-3 bg-green-50 rounded-md">
            <div className="flex items-center mb-2">
              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-sm font-semibold text-green-600">
                {health.readyToMove.count} Deal{health.readyToMove.count > 1 ? 's' : ''} Ready to Move
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Deals ready to advance to next stage
            </p>
          </div>
        )}

        {/* Recommended Actions */}
        {health.recommendedActions.length > 0 && (
          <>
            <Separator className="my-4" />
            <h3 className="text-md font-semibold mb-3">Recommended Actions</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {health.recommendedActions.map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
