'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '@/lib/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Clock, Target, Lightbulb } from 'lucide-react'

interface ScoreComponents {
  engagement?: {
    emailOpens: number
    emailClicks: number
    websiteVisits: number
    demoAttendance: number
    total: number
  }
  demographic?: {
    companySize: number
    industry: number
    geography: number
    total: number
  }
  behavioral?: {
    timeInApp: number
    featureUsage: number
    paymentIntent: number
    total: number
  }
  historical?: {
    similarCustomers: number
    referralSource: number
    total: number
  }
  enhanced?: any
}

interface PredictiveInsight {
  type: string
  title: string
  description: string
  confidence: number
  value?: number
  action?: string
}

interface LeadScoreData {
  score: number
  components: ScoreComponents
  prediction?: {
    likelihoodToClose: number
    avgDaysToClose: number | null
    similarLeadsClosed: number
    recommendedAction: string
    confidence: number
    insights: PredictiveInsight[]
  }
}

interface LeadScoreCardProps {
  contactId: string
  showPredictions?: boolean
}

export function LeadScoreCard({ contactId, showPredictions = true }: LeadScoreCardProps) {
  const { data: scoreData, isLoading, refetch } = useQuery<LeadScoreData>({
    queryKey: ['lead-score', contactId],
    queryFn: async () => {
      const response = await apiRequest(`/api/leads/score?contactId=${contactId}`)
      if (!response.ok) throw new Error('Failed to fetch lead score')
      const data = await response.json()
      return data
    },
  })

  const { data: insightsData } = useQuery<{ prediction: LeadScoreData['prediction'] }>({
    queryKey: ['lead-insights', contactId],
    queryFn: async () => {
      const response = await apiRequest(`/api/crm/leads/${contactId}/insights`)
      if (!response.ok) throw new Error('Failed to fetch insights')
      return response.json()
    },
    enabled: showPredictions,
  })

  const score = scoreData?.score || 0
  const components = scoreData?.components || {}
  const prediction = insightsData?.prediction || scoreData?.prediction

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-50'
    if (score >= 50) return 'text-yellow-600 bg-yellow-50'
    return 'text-gray-600 bg-gray-50'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Hot Lead'
    if (score >= 75) return 'Warm Lead'
    if (score >= 50) return 'Cold Lead'
    return 'Unqualified'
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-500">Loading...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Lead Score</CardTitle>
            <CardDescription>AI-powered lead qualification score</CardDescription>
          </div>
          <Badge className={getScoreColor(score)}>
            {getScoreLabel(score)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Display */}
        <div className="text-center py-4">
          <div className="text-5xl font-bold mb-2" style={{ color: score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#6b7280' }}>
            {Math.round(score)}
          </div>
          <div className="text-sm text-gray-500">out of 100</div>
          <Progress value={score} className="mt-4" />
        </div>

        {/* Score Breakdown */}
        {components.enhanced && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-semibold">Score Breakdown</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="flex justify-between">
                  <span>Engagement</span>
                  <span className="font-medium">{Math.round(components.enhanced.engagement?.total || 0)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Demographic</span>
                  <span className="font-medium">{Math.round(components.enhanced.demographic?.total || 0)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Behavioral</span>
                  <span className="font-medium">{Math.round(components.enhanced.behavioral?.total || 0)}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span>Historical</span>
                  <span className="font-medium">{Math.round(components.enhanced.historical?.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictive Insights */}
        {prediction && showPredictions && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Predictive Insights
            </h4>
            
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-blue-900">Likelihood to Close</span>
                  <span className="text-lg font-bold text-blue-600">{prediction.likelihoodToClose}%</span>
                </div>
                <div className="text-xs text-blue-700">
                  Based on {prediction.similarLeadsClosed} similar leads
                </div>
              </div>

              {prediction.avgDaysToClose && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-purple-900 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Expected Timeline
                    </span>
                    <span className="text-lg font-bold text-purple-600">{prediction.avgDaysToClose} days</span>
                  </div>
                  <div className="text-xs text-purple-700">
                    Average time to close for similar leads
                  </div>
                </div>
              )}

              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-2">
                  <Target className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-green-900 mb-1">Recommended Action</div>
                    <div className="text-xs text-green-700">{prediction.recommendedAction}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <div className="pt-2">
          <button
            onClick={() => refetch()}
            className="w-full text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Refresh Score
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
