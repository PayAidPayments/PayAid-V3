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
  const { token } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) return

    const fetchInsights = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/ai/insights?tenantId=${tenantId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          // CRITICAL: Ensure insights is always an array to prevent .map() errors
          const insightsData = data?.insights
          if (Array.isArray(insightsData)) {
            setInsights(insightsData)
          } else {
            console.warn('[SmartInsights] insights is not an array:', typeof insightsData, insightsData)
            setInsights([])
          }
        } else {
          // Generate mock insights based on stats
          generateMockInsights()
        }
      } catch (error) {
        console.error('Error fetching insights:', error)
        generateMockInsights()
      } finally {
        setIsLoading(false)
      }
    }

    const generateMockInsights = () => {
      const mockInsights: Insight[] = []
      
      if (stats) {
        // Revenue insight
        if (stats.revenueThisMonth > 0) {
          mockInsights.push({
            id: '1',
            type: 'success',
            title: 'Revenue Growth Opportunity',
            description: `Your revenue this month is ₹${stats.revenueThisMonth.toLocaleString('en-IN')}. Based on trends, you could increase this by 15% by focusing on top-performing deals.`,
            impact: 'high',
            action: 'View top deals',
            value: `+15% potential`,
            timestamp: new Date(),
          })
        }

        // Deals closing insight
        if (stats.dealsClosingThisMonth > 0) {
          mockInsights.push({
            id: '2',
            type: 'opportunity',
            title: 'Deals Closing This Month',
            description: `You have ${stats.dealsClosingThisMonth} deals closing this month. Follow up proactively to ensure they close on time.`,
            impact: 'high',
            action: 'View closing deals',
            value: `${stats.dealsClosingThisMonth} deals`,
            timestamp: new Date(),
          })
        }

        // Overdue tasks insight
        if (stats.overdueTasks > 0) {
          mockInsights.push({
            id: '3',
            type: 'warning',
            title: 'Action Required',
            description: `You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''}. Address these to maintain customer satisfaction.`,
            impact: 'high',
            action: 'View overdue tasks',
            value: `${stats.overdueTasks} tasks`,
            timestamp: new Date(),
          })
        }

        // Pipeline insight
        if (stats.pipelineByStage && stats.pipelineByStage.length > 0) {
          const totalDeals = stats.pipelineByStage.reduce((sum: number, stage: any) => sum + stage.count, 0)
          if (totalDeals > 0) {
            mockInsights.push({
              id: '4',
              type: 'info',
              title: 'Pipeline Health',
              description: `Your pipeline has ${totalDeals} active deals across ${stats.pipelineByStage.length} stages. Consider moving deals forward to accelerate revenue.`,
              impact: 'medium',
              action: 'View pipeline',
              value: `${totalDeals} deals`,
              timestamp: new Date(),
            })
          }
        }
      }

      // CRITICAL: Ensure mockInsights is always an array
      setInsights(Array.isArray(mockInsights) ? mockInsights : [])
    }

    fetchInsights()
  }, [tenantId, token, stats])

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

  // CRITICAL: Check if insights is an array and has length before rendering
  if (!Array.isArray(insights) || insights.length === 0) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
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

  // CRITICAL: Normalize insights to always be an array to prevent .map() errors
  const safeInsights = Array.isArray(insights) ? insights : []

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Smart Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <AnimatePresence>
            {safeInsights.map((insight, index) => (
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
