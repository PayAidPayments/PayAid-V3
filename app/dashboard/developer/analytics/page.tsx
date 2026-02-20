'use client'

import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, TrendingUp, Clock, AlertCircle } from 'lucide-react'

export default function ApiAnalyticsPage() {
  const { data: apiKeys } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      const res = await fetch('/api/developer/api-keys', { headers: getAuthHeaders() })
      if (!res.ok) throw new Error('Failed to load API keys')
      const json = await res.json()
      return json.apiKeys
    },
  })

  const { data: usageData } = useQuery({
    queryKey: ['api-usage'],
    queryFn: async () => {
      // Mock data for now - in production, aggregate from ApiUsageLog
      return {
        totalRequests: 1247,
        requestsToday: 89,
        requestsThisWeek: 456,
        averageResponseTime: 145,
        errorRate: 0.02,
        topEndpoints: [
          { endpoint: '/api/v1/contacts', count: 342 },
          { endpoint: '/api/v1/deals', count: 198 },
          { endpoint: '/api/v1/invoices', count: 156 },
        ],
      }
    },
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-7 w-7 text-purple-600" />
          API Usage Analytics
        </h1>
        <p className="text-gray-600 mt-1">
          Monitor your API key usage and performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests</CardDescription>
            <CardTitle className="text-3xl">{usageData?.totalRequests?.toLocaleString() || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Requests Today</CardDescription>
            <CardTitle className="text-3xl">{usageData?.requestsToday || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-1">
              {usageData?.averageResponseTime || 0}ms
              <Clock className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Error Rate</CardDescription>
            <CardTitle className="text-3xl flex items-center gap-1">
              {((usageData?.errorRate ?? 0) * 100).toFixed(1)}%
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Endpoints</CardTitle>
          <CardDescription>Most frequently called API endpoints</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {usageData?.topEndpoints?.map((item: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <code className="text-sm font-mono">{item.endpoint}</code>
                <span className="text-sm font-semibold">{item.count} requests</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Active API keys and their usage</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys?.length ? (
            <div className="space-y-3">
              {apiKeys.map((key: any) => (
                <div key={key.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-semibold">{key.name}</div>
                    <div className="text-sm text-gray-600">
                      {key.scopes.length} scope(s) • {key.usageCount || 0} requests
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Rate limit: {key.rateLimit}/hour
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No API keys yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
