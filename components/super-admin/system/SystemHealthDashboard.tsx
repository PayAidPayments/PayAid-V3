'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle2, XCircle } from 'lucide-react'

interface SystemHealthData {
  api: string
  db: string
  jobs?: string
  whatsapp?: string
  paymentGateway?: string
  uptime?: string
  avgLatency?: number
}

interface SystemHealthDashboardProps {
  data: SystemHealthData | null
  loading?: boolean
}

export function SystemHealthDashboard({ data, loading }: SystemHealthDashboardProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-md border p-8 text-center text-muted-foreground">
        No health data available
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const isOk = status === 'ok'
    return (
      <Badge
        variant={isOk ? 'default' : 'destructive'}
        className={isOk ? 'bg-green-500' : 'bg-red-500'}
      >
        <div className="flex items-center gap-1">
          {isOk ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <XCircle className="h-3 w-3" />
          )}
          {isOk ? 'Healthy' : 'Error'}
        </div>
      </Badge>
    )
  }

  const healthCards = [
    {
      title: 'API',
      status: data.api,
      description: data.uptime ? `Uptime: ${data.uptime}` : undefined,
    },
    {
      title: 'Database',
      status: data.db,
      description: data.avgLatency ? `Avg latency: ${data.avgLatency}ms` : undefined,
    },
    {
      title: 'Jobs',
      status: data.jobs || 'ok',
      description: 'Background jobs',
    },
    {
      title: 'WhatsApp',
      status: data.whatsapp || 'ok',
      description: 'WhatsApp integration',
    },
    {
      title: 'Payment Gateway',
      status: data.paymentGateway || 'ok',
      description: 'PayAid Payments',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {healthCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {getStatusBadge(card.status)}
              {card.description && (
                <p className="text-xs text-muted-foreground mt-2">{card.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.api === 'error' || data.db === 'error' ? (
              <div className="space-y-2">
                {data.db === 'error' && (
                  <div className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-md">
                    <div>
                      <div className="font-medium text-red-900">Database Connection Error</div>
                      <div className="text-sm text-red-700">Unable to connect to database</div>
                    </div>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                )}
                {data.api === 'error' && (
                  <div className="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-md">
                    <div>
                      <div className="font-medium text-red-900">API Error</div>
                      <div className="text-sm text-red-700">API service unavailable</div>
                    </div>
                    <Badge variant="destructive">Error</Badge>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground py-4 text-center">
                No errors in the last 24 hours
              </div>
            )}
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Error logging will be enhanced with monitoring service integration
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle>Security Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground py-4 text-center">
              No security events in the last 24 hours
            </div>
            <div className="text-xs text-muted-foreground pt-2 border-t">
              Security event logging will be enhanced with audit system integration
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
