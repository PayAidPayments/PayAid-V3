'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, TrendingUp, AlertTriangle, Target, ArrowRight, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/lib/stores/auth'

interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'success' | 'info'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  action?: string
  value?: string
  timestamp: Date
}

interface SmartInsightsProps {
  tenantId?: string
  stats?: any
}

export function SmartInsights({ tenantId, stats }: SmartInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { token, tenant } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) {
      console.log('[SmartInsights] Missing requirements:', { tenantId: !!tenantId, token: !!token })
      return
    }

    const fetchInsights = async () => {
      console.log('[SmartInsights] Fetching insights for tenant:', { tenantId, tenantName: tenant?.name })
      try {
        setIsLoading(true)
        const response = await fetch(`/api/ai/insights?tenantId=${tenantId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        console.log('[SmartInsights] API response status:', response.status, response.statusText)

        if (response.ok) {
          const data = await response.json()
          console.log('[SmartInsights] API response:', { 
            hasInsights: !!data?.insights,
            insightsKeys: data?.insights ? Object.keys(data.insights) : [],
            urgentActions: data?.insights?.urgentActions?.length || 0,
            opportunities: data?.insights?.opportunities?.length || 0,
            risks: data?.insights?.risks?.length || 0,
            recommendations: data?.insights?.recommendations?.length || 0,
            improvements: data?.insights?.improvements?.length || 0,
            fullData: data
          })
          
          // Debug: Log the actual arrays to see if they have content
          if (data?.insights) {
            console.log('[SmartInsights] Raw insights arrays:', {
              urgentActions: data.insights.urgentActions,
              opportunities: data.insights.opportunities,
              risks: data.insights.risks,
              recommendations: data.insights.recommendations,
              improvements: data.insights.improvements,
            })
          }
          
          // API returns object with insights.urgentActions, insights.opportunities, etc.
          // Transform API response to our Insight format
          const apiInsights: Insight[] = []
          const insightsData = data?.insights || {}
          
          if (insightsData.urgentActions && Array.isArray(insightsData.urgentActions) && insightsData.urgentActions.length > 0) {
            insightsData.urgentActions.forEach((action: string, idx: number) => {
              apiInsights.push({
                id: `api-urgent-${idx}`,
                type: 'warning',
                title: 'Urgent Action Required',
                description: action,
                impact: 'high',
                timestamp: new Date(),
              })
            })
          }
          
          if (insightsData.opportunities && Array.isArray(insightsData.opportunities) && insightsData.opportunities.length > 0) {
            insightsData.opportunities.forEach((opp: string, idx: number) => {
              apiInsights.push({
                id: `api-opp-${idx}`,
                type: 'opportunity',
                title: 'Revenue Opportunity',
                description: opp,
                impact: 'high',
                timestamp: new Date(),
              })
            })
          }
          
          if (insightsData.risks && Array.isArray(insightsData.risks) && insightsData.risks.length > 0) {
            insightsData.risks.forEach((risk: string, idx: number) => {
              apiInsights.push({
                id: `api-risk-${idx}`,
                type: 'warning',
                title: 'Risk Warning',
                description: risk,
                impact: 'high',
                timestamp: new Date(),
              })
            })
          }
          
          if (insightsData.recommendations && Array.isArray(insightsData.recommendations) && insightsData.recommendations.length > 0) {
            insightsData.recommendations.forEach((rec: string, idx: number) => {
              apiInsights.push({
                id: `api-rec-${idx}`,
                type: 'info',
                title: 'Recommendation',
                description: rec,
                impact: 'medium',
                timestamp: new Date(),
              })
            })
          }
          
          if (insightsData.improvements && Array.isArray(insightsData.improvements) && insightsData.improvements.length > 0) {
            insightsData.improvements.forEach((imp: string, idx: number) => {
              apiInsights.push({
                id: `api-imp-${idx}`,
                type: 'success',
                title: 'Improvement Opportunity',
                description: imp,
                impact: 'medium',
                timestamp: new Date(),
              })
            })
          }
          
          console.log('[SmartInsights] Using AI-generated insights:', apiInsights.length, {
            urgentActions: insightsData.urgentActions?.length || 0,
            opportunities: insightsData.opportunities?.length || 0,
            risks: insightsData.risks?.length || 0,
            recommendations: insightsData.recommendations?.length || 0,
            improvements: insightsData.improvements?.length || 0,
          })
          setInsights(apiInsights)
        } else {
          const errorText = await response.text().catch(() => 'Unknown error')
          console.warn('[SmartInsights] API call failed:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          })
          
          // Even on error, try to show a helpful message
          if (response.status === 403 || response.status === 401) {
            // License/auth issue - show helpful message
            setInsights([{
              id: 'license-error',
              type: 'info',
              title: 'AI Insights Unavailable',
              description: 'AI Smart Insights require the AI Studio module. Please contact your administrator to enable this feature.',
              impact: 'low',
              timestamp: new Date(),
            }])
          } else {
            setInsights([])
          }
        }
      } catch (error) {
        console.error('[SmartInsights] Error fetching insights:', error)
        setInsights([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInsights()
  }, [tenantId, token])

  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return <Target className="w-5 h-5" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />
      case 'success':
        return <TrendingUp className="w-5 h-5" />
      default:
        return <Lightbulb className="w-5 h-5" />
    }
  }

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-300'
      case 'success':
        return 'bg-success-light text-success border-success/30'
      default:
        return 'bg-info-light text-info border-info/30'
    }
  }

  const getImpactBadge = (impact: Insight['impact']) => {
    switch (impact) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">High Impact</Badge>
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-700">Medium Impact</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">Low Impact</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // CRITICAL: Normalize insights to always be an array to prevent .map() errors
  const safeInsights = Array.isArray(insights) ? insights : []

  // CRITICAL: Check if insights is an array and has length before rendering
  // Only show empty state if we're not loading AND have no insights
  if (!isLoading && (!Array.isArray(safeInsights) || safeInsights.length === 0)) {
    return (
      <Card className="border-0 shadow-md rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            Smart Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 text-center py-4">
            No insights available at the moment. Check back later!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        <div className="space-y-3">
          <AnimatePresence>
            {safeInsights.slice(0, 5).map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.1 }}
                className={`
                  p-4 rounded-lg border-2
                  ${getInsightColor(insight.type)}
                  hover:shadow-md transition-shadow cursor-pointer
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                  </div>
                  {getImpactBadge(insight.impact)}
                </div>
                <p className="text-sm mb-3 opacity-90">{insight.description}</p>
                <div className="flex items-center justify-between">
                  {insight.value && (
                    <span className="text-xs font-semibold opacity-75">{insight.value}</span>
                  )}
                  {insight.action && (
                    <button className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                      {insight.action}
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}
