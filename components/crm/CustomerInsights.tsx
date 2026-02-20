'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, AlertTriangle, DollarSign, Activity, Shield } from 'lucide-react'
import { ChurnRiskBadge } from './ChurnRiskBadge'
import { HealthScoreVisualization } from './HealthScoreVisualization'
import { LTVDisplay } from './LTVDisplay'

interface CustomerInsightsProps {
  contactId: string
  tenantId: string
}

export function CustomerInsights({ contactId, tenantId }: CustomerInsightsProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customer-insights', contactId],
    queryFn: async () => {
      const res = await fetch(`/api/crm/contacts/${contactId}/insights`, {
        headers: getAuthHeaders(),
      })
      if (!res.ok) return null
      return res.json()
    },
  })

  const insights = data?.insights

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">Loading insights...</div>
        </CardContent>
      </Card>
    )
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8 text-gray-500">No insights available</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer Insights</CardTitle>
              <CardDescription>AI-powered customer analytics</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetch(`/api/crm/contacts/${contactId}/insights`, {
                  method: 'POST',
                  headers: getAuthHeaders(),
                }).then(() => refetch())
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Health Score */}
          <div>
            <HealthScoreVisualization
              score={insights.healthScore}
            />
          </div>

          {/* Churn Risk */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h3 className="font-semibold">Churn Risk</h3>
            </div>
            <ChurnRiskBadge
              risk={insights.churnRisk}
              level={insights.churnRiskLevel}
              reasons={insights.churnReasons}
              predictionDate={insights.churnPredictionDate}
            />
          </div>

          {/* Lifetime Value */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <h3 className="font-semibold">Lifetime Value</h3>
            </div>
            <LTVDisplay
              ltv={insights.lifetimeValue}
            />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Engagement</div>
              <div className="text-2xl font-bold">{Math.round(insights.engagementScore * 100)}%</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Payment Score</div>
              <div className="text-2xl font-bold">{Math.round(insights.paymentScore * 100)}%</div>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Support Score</div>
              <div className="text-2xl font-bold">{Math.round(insights.supportScore * 100)}%</div>
            </div>
          </div>

          {/* Recommendations */}
          {insights.recommendedActions && insights.recommendedActions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Recommended Actions</h3>
              </div>
              <ul className="space-y-2">
                {insights.recommendedActions.map((action: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
