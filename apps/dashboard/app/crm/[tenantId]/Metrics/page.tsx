'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageLoading } from '@/components/ui/loading'
import { TrendingUp, MessageCircle, Target } from 'lucide-react'

const INDIAN_CURRENCY = '₹'

export default function CRMMetricsPage() {
  const params = useParams()
  const tenantId = params?.tenantId as string

  const { data, isLoading, error } = useQuery({
    queryKey: ['crm-metrics', tenantId],
    queryFn: async () => {
      const res = await apiRequest('/api/crm/analytics/metrics')
      if (!res.ok) throw new Error('Failed to fetch metrics')
      return res.json()
    },
    enabled: !!tenantId,
  })

  if (!tenantId) return <PageLoading message="Loading..." fullScreen={false} />
  if (isLoading) return <PageLoading message="Loading metrics..." fullScreen={false} />
  if (error || !data) {
    return (
      <div className="p-6 text-center text-red-600 dark:text-red-400">
        Failed to load metrics. Please try again.
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Phase 1A Metrics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Conversion rate, score→revenue, WhatsApp rates. All amounts in ₹ INR.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Conversion rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {data.conversionRate}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.totalProspects} prospects → {data.totalCustomers} customers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg score → revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {INDIAN_CURRENCY}{data.avgRevenuePerScoredLead?.toLocaleString('en-IN') ?? '0'}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Avg lead score (with revenue): {data.avgScoreWithRevenue} · Total revenue: {INDIAN_CURRENCY}{data.totalRevenueInr?.toLocaleString('en-IN') ?? '0'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Open {data.whatsappOpenRate}% · Reply {data.whatsappReplyRate}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {data.whatsappSent} sent, {data.whatsappOpened} opened, {data.whatsappReplied} replied
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
