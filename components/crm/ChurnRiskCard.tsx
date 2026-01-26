'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertTriangle, TrendingDown, Calendar } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface ChurnRiskData {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  factors: {
    usageDecline: number
    engagementDrop: number
    supportTickets: number
    paymentDelays: number
    dealActivity: number
  }
  reasons: string[]
  recommendations: string[]
  predictedChurnDate?: string
}

interface ChurnRiskCardProps {
  contactId: string
}

export function ChurnRiskCard({ contactId }: ChurnRiskCardProps) {
  const {
    data,
    isLoading,
    isError,
  } = useQuery<ChurnRiskData, Error>({
    queryKey: ['churnRisk', contactId],
    queryFn: () =>
      apiRequest(`/api/crm/contacts/${contactId}/churn-risk`).then((res) => res.json()),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Churn Risk</CardTitle>
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
          <CardTitle>Churn Risk</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500 text-sm">
          <AlertTriangle className="inline-block h-4 w-4 mr-1" /> Failed to load churn risk.
        </CardContent>
      </Card>
    )
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-600 bg-red-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-green-600 bg-green-100'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Churn Risk</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`text-4xl font-bold ${getRiskColor(data.riskLevel).split(' ')[0]}`}>
              {data.riskScore}%
            </span>
            <Badge className={getRiskColor(data.riskLevel)}>
              {data.riskLevel.toUpperCase()}
            </Badge>
          </div>
          <Progress value={data.riskScore} className="w-[50%]" />
        </div>

        {data.predictedChurnDate && (
          <div className="mb-4 p-3 bg-red-50 rounded-md">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 mr-2 text-red-600" />
              <span className="font-semibold text-red-600">
                Predicted Churn Date: {new Date(data.predictedChurnDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <h3 className="text-md font-semibold mb-3">Risk Factors</h3>
        <div className="space-y-2 text-sm">
          {data.factors.usageDecline < -20 && (
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
              <span>
                Usage down <span className="font-semibold">{Math.abs(data.factors.usageDecline).toFixed(0)}%</span>
              </span>
            </div>
          )}
          {data.factors.engagementDrop < -20 && (
            <div className="flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-orange-500" />
              <span>
                Engagement down <span className="font-semibold">{Math.abs(data.factors.engagementDrop).toFixed(0)}%</span>
              </span>
            </div>
          )}
          {data.factors.supportTickets > 0 && (
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
              <span>
                <span className="font-semibold">{data.factors.supportTickets}</span> support tickets
              </span>
            </div>
          )}
          {data.factors.paymentDelays > 0 && (
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              <span>
                Payment delayed by <span className="font-semibold">{data.factors.paymentDelays}</span> days
              </span>
            </div>
          )}
          {data.factors.dealActivity > 30 && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <span>
                No deal activity for <span className="font-semibold">{Math.floor(data.factors.dealActivity)}</span> days
              </span>
            </div>
          )}
        </div>

        {data.reasons.length > 0 && (
          <>
            <Separator className="my-4" />
            <h3 className="text-md font-semibold mb-3">Why This Risk Score?</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {data.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </>
        )}

        {data.recommendations.length > 0 && (
          <>
            <Separator className="my-4" />
            <h3 className="text-md font-semibold mb-3">Recommended Actions</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              {data.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
