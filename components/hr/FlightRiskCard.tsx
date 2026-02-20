'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, TrendingDown, Users, DollarSign, Target } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface FlightRiskCardProps {
  employeeId: string
  tenantId: string
  token?: string
}

export function FlightRiskCard({ employeeId, tenantId, token }: FlightRiskCardProps) {
  const { data: riskData, isLoading } = useQuery({
    queryKey: ['flight-risk', employeeId],
    queryFn: async () => {
      const res = await fetch(`/api/hr/employees/${employeeId}/flight-risk`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) throw new Error('Failed to fetch flight risk')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse">Loading flight risk...</div>
        </CardContent>
      </Card>
    )
  }

  if (!riskData) return null

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  const getRiskIcon = (level: string) => {
    if (level === 'CRITICAL' || level === 'HIGH') {
      return <AlertTriangle className="h-5 w-5" />
    }
    return <TrendingUp className="h-5 w-5" />
  }

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {getRiskIcon(riskData.riskLevel)}
              Flight Risk Assessment
            </CardTitle>
            <CardDescription>{riskData.employeeName}</CardDescription>
          </div>
          <Badge className={getRiskColor(riskData.riskLevel)}>
            {riskData.riskLevel} ({riskData.riskScore}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Risk Window</p>
          <p className="text-lg">
            {riskData.riskWindow === '30_DAYS' && '⚠️ High risk in next 30 days'}
            {riskData.riskWindow === '60_DAYS' && '⚠️ Risk in next 60 days'}
            {riskData.riskWindow === '90_DAYS' && '⚠️ Risk in next 90 days'}
            {riskData.riskWindow === 'BEYOND_90' && '✅ Low immediate risk'}
          </p>
        </div>

        {riskData.factors && riskData.factors.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Key Risk Factors</p>
            <div className="space-y-2">
              {riskData.factors.slice(0, 3).map((factor: any, index: number) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{factor.factor}</p>
                    <p className="text-muted-foreground">{factor.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {riskData.recommendations && riskData.recommendations.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recommended Actions</p>
            <div className="space-y-2">
              {riskData.recommendations.slice(0, 3).map((rec: any, index: number) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-medium text-sm">{rec.action}</p>
                    <Badge variant={rec.priority === 'HIGH' ? 'destructive' : 'secondary'} className="text-xs">
                      {rec.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Cost: {formatINRForDisplay(rec.estimatedCost)}</span>
                    <span>ROI: {rec.estimatedROI}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
