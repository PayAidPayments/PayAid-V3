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

        if (response.ok) {
          const data = await response.json()
          
          // Check tenant name for Demo Business
          const tenantName = tenant?.name?.trim() || ''
          const isDemoBusiness = tenantName.toLowerCase() === 'demo business pvt ltd.' || 
                                 tenantName.toLowerCase().includes('demo business')
          
          // API returns object with urgentActions, opportunities, risks, recommendations, improvements
          // Transform API response to our Insight format if it has data
          const apiInsights: Insight[] = []
          
          if (data?.urgentActions && Array.isArray(data.urgentActions) && data.urgentActions.length > 0) {
            data.urgentActions.forEach((action: string, idx: number) => {
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
          
          if (data?.opportunities && Array.isArray(data.opportunities) && data.opportunities.length > 0) {
            data.opportunities.forEach((opp: string, idx: number) => {
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
          
          if (data?.risks && Array.isArray(data.risks) && data.risks.length > 0) {
            data.risks.forEach((risk: string, idx: number) => {
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
          
          if (data?.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0) {
            data.recommendations.forEach((rec: string, idx: number) => {
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
          
          // If API returned insights, use them; otherwise generate mock insights for Demo Business
          if (apiInsights.length > 0) {
            console.log('[SmartInsights] Using API insights:', apiInsights.length)
            setInsights(apiInsights)
          } else {
            console.warn('[SmartInsights] API returned empty arrays:', data)
            // For Demo Business, always generate insights even if API returns empty
            if (isDemoBusiness) {
              console.log('[SmartInsights] API returned empty, generating Demo Business insights')
              generateMockInsights()
            } else {
              setInsights([])
            }
          }
        } else {
          // API call failed - generate mock insights (will check for Demo Business inside)
          generateMockInsights()
        }
      } catch (error) {
        console.error('Error fetching insights:', error)
        // On error, generate mock insights (will check for Demo Business inside)
        generateMockInsights()
      } finally {
        setIsLoading(false)
      }
    }

    const generateMockInsights = () => {
      const mockInsights: Insight[] = []
      // Check tenant name more flexibly (case-insensitive, trim whitespace)
      // Use current tenant from auth store (will be updated when tenant loads)
      const currentTenant = useAuthStore.getState().tenant
      const tenantName = (currentTenant?.name || tenant?.name || '').trim()
      const isDemoBusiness = tenantName.toLowerCase() === 'demo business pvt ltd.' || 
                             tenantName.toLowerCase().includes('demo business')
      
      console.log('[SmartInsights] Generating insights:', {
        tenantName,
        isDemoBusiness,
        hasStats: !!stats,
        statsKeys: stats ? Object.keys(stats) : [],
        currentTenantName: currentTenant?.name,
        tenantFromHook: tenant?.name
      })
      
      // For Demo Business, always generate insights even if stats are empty
      if (isDemoBusiness) {
        // Always add demo insights for Demo Business
        mockInsights.push({
          id: 'demo-1',
          type: 'success',
          title: 'Revenue Growth Opportunity',
          description: `Your revenue this month is ₹${stats?.revenueThisMonth?.toLocaleString('en-IN') || '2,50,000'}. Based on trends, you could increase this by 15% by focusing on top-performing deals.`,
          impact: 'high',
          action: 'View top deals',
          value: `+15% potential`,
          timestamp: new Date(),
        })

        mockInsights.push({
          id: 'demo-2',
          type: 'opportunity',
          title: 'Deals Closing This Month',
          description: `You have ${stats?.dealsClosingThisMonth || 5} deals closing this month. Follow up proactively to ensure they close on time.`,
          impact: 'high',
          action: 'View closing deals',
          value: `${stats?.dealsClosingThisMonth || 5} deals`,
          timestamp: new Date(),
        })

        mockInsights.push({
          id: 'demo-3',
          type: 'info',
          title: 'Pipeline Health',
          description: `Your pipeline has ${stats?.pipelineByStage?.reduce((sum: number, stage: any) => sum + (stage?.count || 0), 0) || 12} active deals across ${stats?.pipelineByStage?.length || 5} stages. Consider moving deals forward to accelerate revenue.`,
          impact: 'medium',
          action: 'View pipeline',
          value: `${stats?.pipelineByStage?.reduce((sum: number, stage: any) => sum + (stage?.count || 0), 0) || 12} deals`,
          timestamp: new Date(),
        })

        if (stats?.overdueTasks > 0) {
          mockInsights.push({
            id: 'demo-4',
            type: 'warning',
            title: 'Action Required',
            description: `You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''}. Address these to maintain customer satisfaction.`,
            impact: 'high',
            action: 'View overdue tasks',
            value: `${stats.overdueTasks} tasks`,
            timestamp: new Date(),
          })
        } else {
          // Add a positive insight if no overdue tasks
          mockInsights.push({
            id: 'demo-4',
            type: 'success',
            title: 'Excellent Task Management',
            description: `Great job! You have no overdue tasks. Keep up the momentum and maintain this level of organization.`,
            impact: 'medium',
            action: 'View tasks',
            value: `0 overdue`,
            timestamp: new Date(),
          })
        }
      } else if (stats) {
        // Original logic for other tenants
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
  }, [tenantId, token, stats, tenant?.name])
  
  // Separate effect to handle tenant loading after component mounts
  // This ensures Demo Business gets insights even if tenant loads late
  useEffect(() => {
    if (!tenantId || !token) return
    
    // Check if tenant is Demo Business and we don't have insights yet
    const currentTenant = useAuthStore.getState().tenant
    const tenantName = (currentTenant?.name || tenant?.name || '').trim()
    const isDemoBusiness = tenantName.toLowerCase() === 'demo business pvt ltd.' || 
                           tenantName.toLowerCase().includes('demo business')
    
    if (isDemoBusiness && insights.length === 0 && !isLoading) {
      console.log('[SmartInsights] Regenerating insights for Demo Business (tenant loaded late)')
      const mockInsights: Insight[] = []
      mockInsights.push({
        id: 'demo-1',
        type: 'success',
        title: 'Revenue Growth Opportunity',
        description: `Your revenue this month is ₹${stats?.revenueThisMonth?.toLocaleString('en-IN') || '2,50,000'}. Based on trends, you could increase this by 15% by focusing on top-performing deals.`,
        impact: 'high',
        action: 'View top deals',
        value: `+15% potential`,
        timestamp: new Date(),
      })
      mockInsights.push({
        id: 'demo-2',
        type: 'opportunity',
        title: 'Deals Closing This Month',
        description: `You have ${stats?.dealsClosingThisMonth || 5} deals closing this month. Follow up proactively to ensure they close on time.`,
        impact: 'high',
        action: 'View closing deals',
        value: `${stats?.dealsClosingThisMonth || 5} deals`,
        timestamp: new Date(),
      })
      mockInsights.push({
        id: 'demo-3',
        type: 'info',
        title: 'Pipeline Health',
        description: `Your pipeline has ${stats?.pipelineByStage?.reduce((sum: number, stage: any) => sum + (stage?.count || 0), 0) || 12} active deals across ${stats?.pipelineByStage?.length || 5} stages. Consider moving deals forward to accelerate revenue.`,
        impact: 'medium',
        action: 'View pipeline',
        value: `${stats?.pipelineByStage?.reduce((sum: number, stage: any) => sum + (stage?.count || 0), 0) || 12} deals`,
        timestamp: new Date(),
      })
      if (stats?.overdueTasks > 0) {
        mockInsights.push({
          id: 'demo-4',
          type: 'warning',
          title: 'Action Required',
          description: `You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''}. Address these to maintain customer satisfaction.`,
          impact: 'high',
          action: 'View overdue tasks',
          value: `${stats.overdueTasks} tasks`,
          timestamp: new Date(),
        })
      } else {
        mockInsights.push({
          id: 'demo-4',
          type: 'success',
          title: 'Excellent Task Management',
          description: `Great job! You have no overdue tasks. Keep up the momentum and maintain this level of organization.`,
          impact: 'medium',
          action: 'View tasks',
          value: `0 overdue`,
          timestamp: new Date(),
        })
      }
      setInsights(mockInsights)
    }
  }, [tenantId, token, tenant?.name, insights.length, isLoading, stats])

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
