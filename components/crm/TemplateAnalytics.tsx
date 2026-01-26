'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, DollarSign, Clock, Target } from 'lucide-react'

interface TemplateMetrics {
  templateId: string
  industry: string
  totalDeals: number
  dealsByStage: Record<string, number>
  averageDealValue: number
  conversionRate: number
  averageDaysInStage: Record<string, number>
  winRate: number
  totalRevenue: number
}

interface PerformanceData {
  currentTemplate: TemplateMetrics | null
  recommendations: string[]
}

export function TemplateAnalytics() {
  const { data, isLoading } = useQuery<{ performance: PerformanceData }>({
    queryKey: ['template-analytics'],
    queryFn: async () => {
      const response = await apiRequest('/api/crm/templates/analytics')
      if (!response.ok) throw new Error('Failed to fetch analytics')
      return response.json()
    },
  })

  const performance = data?.performance
  const metrics = performance?.currentTemplate

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Template Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Template Analytics</CardTitle>
          <CardDescription>No template applied yet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">
            Apply an industry template to see analytics
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Template Performance</CardTitle>
          <CardDescription>
            Analytics for {metrics.industry.toUpperCase()} template
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">Total Deals</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">{metrics.totalDeals}</div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-800 font-medium">Win Rate</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {metrics.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-purple-800 font-medium">Avg Deal Value</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                ₹{metrics.averageDealValue.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="h-4 w-4 text-orange-600" />
                <span className="text-sm text-orange-800 font-medium">Total Revenue</span>
              </div>
              <div className="text-2xl font-bold text-orange-900">
                ₹{metrics.totalRevenue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deals by Stage */}
      <Card>
        <CardHeader>
          <CardTitle>Deals by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(metrics.dealsByStage).map(([stage, count]) => (
              <div key={stage} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm font-medium capitalize">{stage.replace(/-/g, ' ')}</span>
                <span className="text-sm font-bold">{count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {performance?.recommendations && performance.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {performance.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
