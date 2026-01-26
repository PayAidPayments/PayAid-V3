'use client'

import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

interface RevenueForecastData {
  timeSeriesForecast: {
    summary: {
      total90Day: number
      dailyAverage: number
      projectionVsCurrent: number
    }
    confidence: number
  }
  dealBasedForecast: {
    scenarios: {
      conservative: number
      base: number
      upside: number
      confidence: number
    }
    totalExpectedValue: number
    confidenceIntervals: {
      lower80: number
      upper80: number
      lower95: number
      upper95: number
    }
  }
  combinedForecast: {
    conservative: number
    base: number
    upside: number
    confidence: number
  }
}

export function RevenueForecast() {
  const {
    data,
    isLoading,
    isError,
  } = useQuery<RevenueForecastData, Error>({
    queryKey: ['revenueForecast'],
    queryFn: () =>
      apiRequest('/api/crm/analytics/revenue-forecast').then((res) => res.json()),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>90-Day Revenue Forecast</CardTitle>
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
          <CardTitle>90-Day Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent className="text-red-500 text-sm">
          <AlertCircle className="inline-block h-4 w-4 mr-1" /> Failed to load forecast.
        </CardContent>
      </Card>
    )
  }

  const { combinedForecast, dealBasedForecast } = data

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">90-Day Revenue Forecast</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {/* Scenarios */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Conservative</p>
            <p className="text-lg font-bold text-orange-600">
              ₹{(combinedForecast.conservative / 100000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground">P20 Scenario</p>
          </div>
          <div className="text-center border-l border-r">
            <p className="text-xs text-muted-foreground mb-1">Base Forecast</p>
            <p className="text-2xl font-bold text-blue-600">
              ₹{(combinedForecast.base / 100000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground">P50 Scenario</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Upside</p>
            <p className="text-lg font-bold text-green-600">
              ₹{(combinedForecast.upside / 100000).toFixed(1)}L
            </p>
            <p className="text-xs text-muted-foreground">P80 Scenario</p>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Confidence */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Forecast Confidence</span>
            <span className="text-sm text-muted-foreground">
              {combinedForecast.confidence}%
            </span>
          </div>
          <Progress value={combinedForecast.confidence} className="h-2" />
        </div>

        {/* Confidence Intervals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">80% Confidence Range:</span>
            <span className="font-medium">
              ₹{(dealBasedForecast.confidenceIntervals.lower80 / 100000).toFixed(1)}L - ₹
              {(dealBasedForecast.confidenceIntervals.upper80 / 100000).toFixed(1)}L
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">95% Confidence Range:</span>
            <span className="font-medium">
              ₹{(dealBasedForecast.confidenceIntervals.lower95 / 100000).toFixed(1)}L - ₹
              {(dealBasedForecast.confidenceIntervals.upper95 / 100000).toFixed(1)}L
            </span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Deal Breakdown Summary */}
        <div>
          <p className="text-sm font-medium mb-2">Deal-Based Forecast</p>
          <p className="text-sm text-muted-foreground">
            Total Expected Value: ₹{(dealBasedForecast.totalExpectedValue / 100000).toFixed(1)}L
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Based on {dealBasedForecast.totalExpectedValue > 0 ? 'active deals' : 'no active deals'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
