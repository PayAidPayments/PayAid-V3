'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/lib/stores/auth'

interface FlightRiskAlertsProps {
  tenantId: string
  limit?: number
}

export function FlightRiskAlerts({ tenantId, limit = 5 }: FlightRiskAlertsProps) {
  const { token } = useAuthStore()

  const { data: alertsData, isLoading } = useQuery({
    queryKey: ['flight-risk-alerts', tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/ai/flight-risk-alerts?minRiskScore=60&limit=${limit}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch flight risk alerts')
      return res.json()
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse">Loading flight risk alerts...</div>
        </CardContent>
      </Card>
    )
  }

  if (!alertsData || !alertsData.alerts || alertsData.alerts.length === 0) {
    return null
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    }
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Flight Risk Alerts
            </CardTitle>
            <CardDescription>
              {alertsData.totalHighRisk} employee(s) at high risk of leaving
            </CardDescription>
          </div>
          <Badge variant="destructive">{alertsData.totalHighRisk}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alertsData.alerts.slice(0, limit).map((alert: any) => (
            <Link
              key={alert.employeeId}
              href={`/hr/${tenantId}/Employees/${alert.employeeId}`}
              className="block p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{alert.employeeName}</p>
                    <Badge className={getRiskColor(alert.riskLevel)}>
                      {alert.riskLevel} ({alert.riskScore}%)
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {alert.department} • {alert.designation}
                  </p>
                  {alert.factors && alert.factors.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Top risk: {alert.factors[0].factor}
                    </p>
                  )}
                </div>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </div>
            </Link>
          ))}
        </div>
        {alertsData.totalHighRisk > limit && (
          <div className="mt-4 pt-4 border-t">
            <Link href={`/hr/${tenantId}/Employees?filter=high-risk`}>
              <p className="text-sm text-center text-muted-foreground hover:text-foreground">
                View all {alertsData.totalHighRisk} high-risk employees →
              </p>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
