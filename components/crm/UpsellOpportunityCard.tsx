'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, Sparkles, DollarSign } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface UpsellOpportunityData {
  opportunityScore: number
  opportunityLevel: 'low' | 'medium' | 'high' | 'very-high'
  signals: {
    featureUsage: number
    usageGrowth: number
    teamSize: number
    paymentHistory: number
    engagement: number
  }
  recommendedFeatures: string[]
  estimatedUpsellValue: number
  estimatedRetentionBoost: number
  recommendations: string[]
}

interface UpsellOpportunityCardProps {
  contactId: string
}

export function UpsellOpportunityCard({ contactId }: UpsellOpportunityCardProps) {
  const {
    data,
    isLoading,
    isError,
  } = useQuery<UpsellOpportunityData, Error>({
    queryKey: ['upsellOpportunity', contactId],
    queryFn: () =>
      apiRequest(`/api/crm/contacts/${contactId}/upsell`).then((res) => res.json()),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upsell Opportunity</CardTitle>
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
          <CardTitle>Upsell Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500 text-sm">
          <Sparkles className="inline-block h-4 w-4 mr-1" /> Failed to load upsell opportunity.
        </CardContent>
      </Card>
    )
  }

  const getOpportunityColor = (level: string) => {
    switch (level) {
      case 'very-high':
        return 'text-green-600 bg-green-100'
      case 'high':
        return 'text-blue-600 bg-blue-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Upsell Opportunity</CardTitle>
        <Sparkles className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`text-4xl font-bold ${getOpportunityColor(data.opportunityLevel).split(' ')[0]}`}>
              {data.opportunityScore}%
            </span>
            <Badge className={getOpportunityColor(data.opportunityLevel)}>
              {data.opportunityLevel.toUpperCase().replace('-', ' ')}
            </Badge>
          </div>
          <Progress value={data.opportunityScore} className="w-[50%]" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-green-50 rounded-md">
            <div className="flex items-center mb-1">
              <DollarSign className="h-4 w-4 mr-1 text-green-600" />
              <span className="text-xs text-muted-foreground">Est. Upsell Value</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              ₹{(data.estimatedUpsellValue / 1000).toFixed(0)}k/month
            </p>
          </div>
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="flex items-center mb-1">
              <TrendingUp className="h-4 w-4 mr-1 text-blue-600" />
              <span className="text-xs text-muted-foreground">Retention Boost</span>
            </div>
            <p className="text-lg font-bold text-blue-600">
              +{data.estimatedRetentionBoost}%
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <h3 className="text-md font-semibold mb-3">Opportunity Signals</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Feature Usage:</span>
            <span className="font-medium">{data.signals.featureUsage.toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Usage Growth:</span>
            <span className={`font-medium ${data.signals.usageGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.signals.usageGrowth > 0 ? '+' : ''}{data.signals.usageGrowth.toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Team Size:</span>
            <span className="font-medium">{data.signals.teamSize}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Engagement:</span>
            <span className="font-medium">{data.signals.engagement.toFixed(0)}%</span>
          </div>
        </div>

        {data.recommendedFeatures.length > 0 && (
          <>
            <Separator className="my-4" />
            <h3 className="text-md font-semibold mb-3">Recommended Features</h3>
            <div className="flex flex-wrap gap-2">
              {data.recommendedFeatures.map((feature, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </>
        )}

        {data.recommendations.length > 0 && (
          <>
            <Separator className="my-4" />
            <h3 className="text-md font-semibold mb-3">Upsell Recommendations</h3>
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
