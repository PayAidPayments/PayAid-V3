'use client'

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { getAuthHeaders } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function WebhookLogsPage() {
  const params = useParams()
  const webhookId = params?.id as string

  const { data: logs, isLoading } = useQuery({
    queryKey: ['webhook-logs', webhookId],
    queryFn: async () => {
      // TODO: Implement API endpoint to fetch webhook delivery logs
      // For now, return mock data structure
      return []
    },
  })

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhook Delivery Logs</h1>
          <p className="text-gray-600 mt-1">
            View delivery history for webhook: {webhookId}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/developer/webhooks">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Webhooks
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>Recent webhook delivery attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading logs...</div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No delivery logs yet</p>
              <p className="text-sm text-gray-500 mt-2">
                Logs will appear here after webhook events are triggered
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {log.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{log.event}</span>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                      {log.error && (
                        <div className="text-sm text-red-600 mt-1">{log.error}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {log.responseTime}ms
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
