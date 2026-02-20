'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Lightbulb, AlertTriangle, Bell, CheckCircle, Info, Zap, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface Insight {
  id: string
  type: 'opportunity' | 'warning' | 'success' | 'info'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  timestamp: Date
}

interface Alert {
  id: string
  type: 'critical' | 'warning' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  read: boolean
}

interface HRAIInsightsAndAlertsProps {
  tenantId?: string
  stats?: any
}

export function HRAIInsightsAndAlerts({ tenantId, stats }: HRAIInsightsAndAlertsProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'opportunities' | 'risks' | 'tasks'>('opportunities')
  const { token } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) {
      generateFallbackData()
      return
    }

    fetchAIInsights()
  }, [tenantId, token, stats])

  const generateFallbackData = () => {
    const fallbackInsights: Insight[] = []
    const fallbackAlerts: Alert[] = []

    if (stats) {
      // Flight Risk Opportunities
      if (stats.flightRisks && stats.flightRisks.length > 0) {
        stats.flightRisks.slice(0, 2).forEach((risk: any, idx: number) => {
          fallbackInsights.push({
            id: `opp-${idx}`,
            type: 'opportunity',
            title: 'Retention Opportunity',
            description: `${risk.name}: ${risk.risk}% flight risk - ${risk.reason}. Consider retention strategies.`,
            impact: 'high',
            timestamp: new Date(),
          })
        })
      }

      // High-value employees at risk
      if (stats.headcount > 0 && stats.turnover > 8) {
        fallbackInsights.push({
          id: 'opp-turnover',
          type: 'warning',
          title: 'Turnover Alert',
          description: `Turnover rate is ${stats.turnover}% (industry avg: 12%). Focus on retention initiatives.`,
          impact: 'high',
          timestamp: new Date(),
        })
      }

      // Payroll opportunities
      if (stats.nextPayrollAmount > 0) {
        fallbackInsights.push({
          id: 'opp-payroll',
          type: 'opportunity',
          title: 'Payroll Due',
          description: `Next payroll of ${formatINRForDisplay(stats.nextPayrollAmount)} due soon. Ensure compliance checks are complete.`,
          impact: 'medium',
          timestamp: new Date(),
        })
      }

      // Compliance risks
      if (stats.complianceScore < 95) {
        fallbackAlerts.push({
          id: 'alert-compliance',
          type: 'critical',
          title: 'Compliance Risk',
          message: `Compliance score is ${stats.complianceScore}%. Review statutory filings immediately.`,
          timestamp: new Date(),
          read: false,
        })
      }

      // Training opportunities
      if (stats.trainingDue > 0) {
        fallbackInsights.push({
          id: 'opp-training',
          type: 'info',
          title: 'Training Required',
          description: `${stats.trainingDue} employees due for training. Schedule sessions to improve skills.`,
          impact: 'medium',
          timestamp: new Date(),
        })
      }

      // Engagement opportunities
      if (stats.avgEngagement < 80) {
        fallbackInsights.push({
          id: 'opp-engagement',
          type: 'warning',
          title: 'Engagement Below Target',
          description: `Average engagement is ${stats.avgEngagement}/100. Target is 85+. Consider team building activities.`,
          impact: 'high',
          timestamp: new Date(),
        })
      }
    }

    setInsights(fallbackInsights)
    setAlerts(fallbackAlerts)
    setIsLoading(false)
  }

  const fetchAIInsights = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/hr/ai/analytics?tenantId=${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const insightsData = data?.insights || {}
        
        const transformedInsights: Insight[] = []
        const transformedAlerts: Alert[] = []

        // Transform opportunities
        if (insightsData.opportunities && Array.isArray(insightsData.opportunities)) {
          insightsData.opportunities.forEach((opp: string, idx: number) => {
            transformedInsights.push({
              id: `opp-${idx}`,
              type: 'opportunity',
              title: 'HR Opportunity',
              description: opp,
              impact: 'high',
              timestamp: new Date(),
            })
          })
        }

        // Transform risks
        if (insightsData.risks && Array.isArray(insightsData.risks)) {
          insightsData.risks.forEach((risk: string, idx: number) => {
            transformedInsights.push({
              id: `risk-${idx}`,
              type: 'warning',
              title: 'Risk Detected',
              description: risk,
              impact: 'high',
              timestamp: new Date(),
            })
          })
        }

        // Transform urgent actions as alerts
        if (insightsData.urgentActions && Array.isArray(insightsData.urgentActions)) {
          insightsData.urgentActions.forEach((action: string, idx: number) => {
            transformedAlerts.push({
              id: `alert-${idx}`,
              type: 'critical',
              title: 'Urgent Action Required',
              message: action,
              timestamp: new Date(),
              read: false,
            })
          })
        }

        // If no insights from API, use fallback data
        if (transformedInsights.length === 0) {
          generateFallbackData()
        } else {
          setInsights(transformedInsights)
          setAlerts(transformedAlerts)
        }
      } else {
        generateFallbackData()
      }
    } catch (error) {
      console.error('[HRAIInsightsAndAlerts] Error fetching insights:', error)
      generateFallbackData()
    } finally {
      setIsLoading(false)
    }
  }

  const getFilteredInsights = () => {
    if (activeTab === 'opportunities') {
      return insights.filter(i => i.type === 'opportunity' || i.type === 'success')
    } else if (activeTab === 'risks') {
      return insights.filter(i => i.type === 'warning' || i.type === 'info')
    } else {
      return insights.filter(i => i.description.toLowerCase().includes('training') || i.description.toLowerCase().includes('task'))
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
      case 'success':
        return <TrendingUp className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'opportunity':
      case 'success':
        return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
      case 'warning':
        return 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
      case 'info':
        return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
    }
  }

  const unreadCount = alerts.filter(a => !a.read).length

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 rounded-xl" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Zap className="h-5 w-5 text-purple-600" />
            AI Insights & Alerts
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
            <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
            <TabsTrigger value="risks">Risks</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
          </TabsList>

          <TabsContent value="opportunities" className="mt-4 space-y-3 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60px)' }}>
            {getFilteredInsights().length > 0 ? (
              getFilteredInsights().slice(0, 5).map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-lg border ${getColorClasses(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(insight.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">{insight.title}</p>
                      <p className="text-xs opacity-90">{insight.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No opportunities identified</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="risks" className="mt-4 space-y-3 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60px)' }}>
            {getFilteredInsights().length > 0 ? (
              getFilteredInsights().slice(0, 5).map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-lg border ${getColorClasses(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(insight.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">{insight.title}</p>
                      <p className="text-xs opacity-90">{insight.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No risks detected</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tasks" className="mt-4 space-y-3 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60px)' }}>
            {alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-lg border ${
                    alert.type === 'critical'
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
                      : alert.type === 'warning'
                      ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                      : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Bell className="h-4 w-4 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">{alert.title}</p>
                      <p className="text-xs opacity-90">{alert.message}</p>
                    </div>
                    {!alert.read && (
                      <Badge variant="destructive" className="h-2 w-2 p-0 rounded-full" />
                    )}
                  </div>
                </motion.div>
              ))
            ) : getFilteredInsights().length > 0 ? (
              getFilteredInsights().slice(0, 5).map((insight) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3 rounded-lg border ${getColorClasses(insight.type)}`}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(insight.type)}
                    <div className="flex-1">
                      <p className="font-medium text-sm mb-1">{insight.title}</p>
                      <p className="text-xs opacity-90">{insight.description}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No task-related insights</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
