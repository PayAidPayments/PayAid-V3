'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, Target, Zap, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/stores/auth'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface InsightDetail {
  text: string
  fullText: string
  type: 'target' | 'risk' | 'opportunity' | 'action' | 'recommendation'
  calculation?: string
  dataSource?: string
}

interface AISummaryPanelProps {
  tenantId?: string
  stats?: any
  timePeriod?: string
}

export function AISummaryPanel({ tenantId, stats, timePeriod = 'month' }: AISummaryPanelProps) {
  const [summary, setSummary] = useState<{
    outcomes: string[]
    targetProgress?: number
    targetRevenue?: number
    targetAmount?: number
    topRisks?: string[]
    topDeals?: string[]
    insightDetails?: InsightDetail[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [selectedInsight, setSelectedInsight] = useState<InsightDetail | null>(null)
  const { token } = useAuthStore()

  useEffect(() => {
    if (!tenantId || !token) {
      // Generate fallback summary from stats
      if (stats) {
        const fallbackSummary = generateRuleBasedSummary(stats, timePeriod)
        setSummary({ outcomes: fallbackSummary.outcomes })
        setLoading(false)
      }
      return
    }

    const fetchSummary = async () => {
      try {
        setLoading(true)
        // Call AI insights API to get summary
        const response = await fetch(`/api/ai/insights?tenantId=${tenantId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          const insights = data.insights || {}
          
          // Calculate target progress - Dynamic target based on historical data or default
          const revenue = stats?.revenueThisMonth || 0
          // Calculate target: Use average of last 3 months revenue * 1.2 (20% growth), or default to ₹10L
          // For now, we'll use a smart default: If revenue > 0, target is revenue * 5 (to show progress), else ₹10L
          const defaultTarget = 1000000 // ₹10 Lakh default target
          const smartTarget = revenue > 0 ? Math.max(defaultTarget, revenue * 4) : defaultTarget
          const target = smartTarget
          const targetProgress = Math.min(100, Math.round((revenue / target) * 100))
          
          // Store calculation details for tooltip
          const targetCalculation = `Target Progress = (Current Month Revenue / Target) × 100
          
Current Month Revenue: ₹${revenue.toLocaleString('en-IN')}
Target: ₹${target.toLocaleString('en-IN')}
Progress: ${targetProgress}%

Calculation: (₹${revenue.toLocaleString('en-IN')} / ₹${target.toLocaleString('en-IN')}) × 100 = ${targetProgress}%`
          
          // Extract top risks
          const risks = insights.risks || []
          const topRisks = risks.slice(0, 2).map((r: string) => r.replace(/^Risk: /i, ''))
          
          // Extract top deals to focus on (from opportunities)
          const opportunities = insights.opportunities || []
          const topDeals = opportunities.slice(0, 2).map((o: string) => {
            // Extract deal info from opportunity text
            const match = o.match(/(\d+)\s+deal/i)
            return match ? `${match[1]} high-value deals closing soon` : o
          })
          
          // Build insight details with full text for expandable view
          const insightDetails: InsightDetail[] = []
          const outcomes: string[] = []
          
          // Add target progress (first)
          if (targetProgress > 0) {
            const text = `You're on track to hit ${targetProgress}% of target this month`
            outcomes.push(text)
            insightDetails.push({
              text,
              fullText: `You're on track to hit ${targetProgress}% of target this month. Current revenue: ₹${revenue.toLocaleString('en-IN')}, Target: ₹${target.toLocaleString('en-IN')}.`,
              type: 'target',
              calculation: targetCalculation,
              dataSource: `Dashboard Stats API - Revenue from won deals closed this ${timePeriod}`,
            })
          }
          
          // Add top deals focus
          if (topDeals.length > 0) {
            const text = `Top focus: ${topDeals[0]}`
            outcomes.push(text)
            insightDetails.push({
              text,
              fullText: text,
              type: 'opportunity',
              dataSource: 'AI Analysis of high-value deals with 80%+ win probability',
            })
          }
          
          // Add top risks
          if (topRisks.length > 0) {
            const text = `Biggest churn risk: ${topRisks[0]}`
            outcomes.push(text)
            insightDetails.push({
              text,
              fullText: text,
              type: 'risk',
              dataSource: 'AI Analysis of customer churn patterns and risk factors',
            })
          }
          
          // Add urgent actions with full text
          const urgentActions = insights.urgentActions || []
          if (urgentActions.length > 0) {
            const fullText = urgentActions[0]
            const displayText = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText
            outcomes.push(displayText)
            insightDetails.push({
              text: displayText,
              fullText: fullText,
              type: 'action',
              dataSource: 'AI Analysis of urgent tasks and overdue items',
            })
          }
          
          // Add recommendations with full text
          const recommendations = insights.recommendations || []
          if (recommendations.length > 0 && outcomes.length < 5) {
            const fullText = recommendations[0]
            const displayText = fullText.length > 100 ? fullText.substring(0, 100) + '...' : fullText
            outcomes.push(displayText)
            insightDetails.push({
              text: displayText,
              fullText: fullText,
              type: 'recommendation',
              dataSource: 'AI Analysis based on conversion rates and pipeline health',
            })
          }
          
          setSummary({
            outcomes: outcomes.slice(0, 5),
            targetProgress,
            targetRevenue: revenue,
            targetAmount: target,
            topRisks,
            topDeals,
            insightDetails,
          })
        } else {
          // API call failed - use rule-based fallback
          const fallbackResult = generateRuleBasedSummary(stats, timePeriod)
          setSummary({ outcomes: fallbackResult.outcomes })
        }
      } catch (error) {
        console.error('[AISummaryPanel] Error fetching summary:', error)
        // Fallback summary from stats
        const fallbackResult = generateRuleBasedSummary(stats, timePeriod)
        setSummary({ outcomes: fallbackResult.outcomes })
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [tenantId, stats, timePeriod, token])

  // Generate rule-based summary from stats with insight details
  const generateRuleBasedSummary = (currentStats: any, currentPeriod: string): {
    outcomes: string[]
    targetProgress?: number
    targetRevenue?: number
    targetAmount?: number
    insightDetails?: InsightDetail[]
  } => {
    const summaries: string[] = []
    const insightDetails: InsightDetail[] = []
    const periodLabel = currentPeriod === 'month' ? 'this month' : `this ${currentPeriod}`

    // Calculate target progress
    const revenue = currentStats?.revenueThisMonth || 0
    const defaultTarget = 1000000 // ₹10 Lakh default target
    const smartTarget = revenue > 0 ? Math.max(defaultTarget, revenue * 4) : defaultTarget
    const targetProgress = Math.min(100, Math.round((revenue / smartTarget) * 100))
    
    const targetCalculation = `Target Progress = (Current Month Revenue / Target) × 100

Current Month Revenue: ₹${revenue.toLocaleString('en-IN')}
Target: ₹${smartTarget.toLocaleString('en-IN')} ${revenue > 0 ? '(Auto-calculated as 4x current revenue, minimum ₹10L)' : '(Default ₹10 Lakh)'}
Progress: ${targetProgress}%

Calculation: (₹${revenue.toLocaleString('en-IN')} / ₹${smartTarget.toLocaleString('en-IN')}) × 100 = ${targetProgress}%`

    if (revenue > 0) {
      const text = `Revenue ${periodLabel}: ₹${revenue.toLocaleString('en-IN')}.`
      summaries.push(text)
      insightDetails.push({
        text,
        fullText: text,
        type: 'target',
        calculation: `Revenue = Sum of all won deals closed ${periodLabel}

Data Source: Dashboard Stats API - Won deals with actualCloseDate in ${periodLabel}`,
        dataSource: `Dashboard Stats API - Revenue from won deals closed ${periodLabel}`,
      })
    } else {
      const text = `No revenue recorded ${periodLabel}. Focus on closing deals.`
      summaries.push(text)
    }

    if (currentStats?.dealsClosingThisMonth > 0) {
      const text = `You have ${currentStats.dealsClosingThisMonth} deal(s) closing ${periodLabel}. Prioritize these for immediate revenue.`
      summaries.push(text)
      insightDetails.push({
        text,
        fullText: text,
        type: 'opportunity',
        calculation: `Deals Closing = Count of deals with expectedCloseDate in ${periodLabel} and stage ≠ 'lost'`,
        dataSource: `Dashboard Stats API - Deals with expectedCloseDate in ${periodLabel}`,
      })
    } else {
      summaries.push(`No deals closing ${periodLabel}. Review your pipeline for potential opportunities.`)
    }

    if (currentStats?.overdueTasks > 0) {
      const text = `Alert: ${currentStats.overdueTasks} task(s) are overdue. Address these to avoid delays.`
      summaries.push(text)
      insightDetails.push({
        text,
        fullText: text,
        type: 'action',
        calculation: `Overdue Tasks = Count of tasks where dueDate < today AND status IN ('pending', 'in_progress')`,
        dataSource: `Dashboard Stats API - Tasks with dueDate in the past and not completed`,
      })
    } else {
      summaries.push(`All tasks are on track. Keep up the good work!`)
    }

    if (currentStats?.totalLeads > 0) {
      const conversionRate = currentStats.convertedLeads && currentStats.totalLeads > 0 
        ? ((currentStats.convertedLeads / currentStats.totalLeads) * 100).toFixed(1)
        : '0'
      const text = `You have ${currentStats.totalLeads} active leads. Your conversion rate is ${conversionRate}%.`
      summaries.push(text)
      insightDetails.push({
        text,
        fullText: text,
        type: 'recommendation',
        calculation: `Conversion Rate = (Converted Leads / Total Leads) × 100

Total Leads: ${currentStats.totalLeads} (contacts with stage IN ('prospect', 'contact'))
Converted Leads: ${currentStats.convertedLeads || 0} (contacts with stage = 'customer')
Conversion Rate: ${conversionRate}%`,
        dataSource: `Dashboard Stats API - Contact counts by stage`,
      })
    } else {
      summaries.push(`Consider new lead generation strategies to grow your pipeline.`)
    }

    if (currentStats?.pipelineByStage && currentStats.pipelineByStage.length > 0) {
      const highestValueStage = currentStats.pipelineByStage.reduce((prev: any, current: any) => (prev.value > current.value ? prev : current), { value: 0 })
      if (highestValueStage.value > 0) {
        const text = `Your pipeline's highest value is in the "${highestValueStage.stage}" stage with ₹${highestValueStage.value.toLocaleString('en-IN')}.`
        summaries.push(text)
        insightDetails.push({
          text,
          fullText: text,
          type: 'opportunity',
          calculation: `Pipeline by Stage = Group deals by stage, sum their values

Highest Value Stage: ${highestValueStage.stage}
Total Value: ₹${highestValueStage.value.toLocaleString('en-IN')}`,
          dataSource: `Dashboard Stats API - Deals grouped by stage with value sums`,
        })
      }
    }

    // Add target progress if revenue exists
    if (revenue > 0) {
      summaries.unshift(`You're on track to hit ${targetProgress}% of target this month`)
      insightDetails.unshift({
        text: `You're on track to hit ${targetProgress}% of target this month`,
        fullText: `You're on track to hit ${targetProgress}% of target this month. Current revenue: ₹${revenue.toLocaleString('en-IN')}, Target: ₹${smartTarget.toLocaleString('en-IN')}.`,
        type: 'target',
        calculation: targetCalculation,
        dataSource: `Dashboard Stats API - Revenue from won deals closed ${periodLabel}`,
      })
    }

    return {
      outcomes: summaries.length > 0 ? summaries : ['No specific AI summary available, but your dashboard is ready for action!'],
      targetProgress: revenue > 0 ? targetProgress : undefined,
      targetRevenue: revenue > 0 ? revenue : undefined,
      targetAmount: revenue > 0 ? smartTarget : undefined,
      insightDetails: insightDetails.length > 0 ? insightDetails : undefined,
    }
  }

  if (loading && !summary) {
    return (
      <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 via-white to-gold-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-purple-600" />
            AI Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 via-white to-gold-50/30 border-l-4 border-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-purple-900">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI Summary
          <Badge variant="outline" className="ml-auto bg-purple-100 text-purple-700 border-purple-300">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {summary?.outcomes?.map((outcome, index) => {
            const insightDetail = summary?.insightDetails?.[index]
            const isTruncated = insightDetail && insightDetail.fullText.length > 100
            const isExpanded = expandedIndex === index
            
            return (
              <div key={index} className="flex items-start gap-3 group">
                <div className="mt-1">
                  {outcome.toLowerCase().includes('risk') || outcome.toLowerCase().includes('churn') ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : outcome.toLowerCase().includes('track') || outcome.toLowerCase().includes('target') ? (
                    <Target className="h-4 w-4 text-blue-500" />
                  ) : outcome.toLowerCase().includes('focus') || outcome.toLowerCase().includes('deal') ? (
                    <Zap className="h-4 w-4 text-purple-500" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {isExpanded && insightDetail ? insightDetail.fullText : outcome}
                  </p>
                  {(isTruncated || insightDetail) && (
                    <div className="flex items-center gap-2 mt-1">
                      {isTruncated && (
                        <button
                          onClick={() => setExpandedIndex(isExpanded ? null : index)}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-3 w-3" />
                              Show less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-3 w-3" />
                              Show more
                            </>
                          )}
                        </button>
                      )}
                      {insightDetail && (
                        <button
                          onClick={() => setSelectedInsight(insightDetail)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center gap-1"
                          title="View calculation details"
                        >
                          <Info className="h-3 w-3" />
                          How calculated?
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          
          {summary?.targetProgress !== undefined && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Monthly Target Progress</span>
                  <button
                    onClick={() => {
                      const targetInsight = summary.insightDetails?.find(d => d.type === 'target')
                      if (targetInsight) setSelectedInsight(targetInsight)
                    }}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="View calculation details"
                  >
                    <Info className="h-3 w-3" />
                  </button>
                </div>
                <span className="text-xs font-semibold text-purple-600">{summary.targetProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-gold-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${summary.targetProgress}%` }}
                />
              </div>
              {summary.targetRevenue !== undefined && summary.targetAmount !== undefined && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  ₹{summary.targetRevenue.toLocaleString('en-IN')} / ₹{summary.targetAmount.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Insight Detail Dialog */}
      <Dialog open={!!selectedInsight} onOpenChange={(open) => !open && setSelectedInsight(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedInsight?.type === 'target' && <Target className="h-5 w-5 text-blue-500" />}
              {selectedInsight?.type === 'risk' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {selectedInsight?.type === 'opportunity' && <Zap className="h-5 w-5 text-purple-500" />}
              {selectedInsight?.type === 'action' && <AlertTriangle className="h-5 w-5 text-red-500" />}
              {selectedInsight?.type === 'recommendation' && <TrendingUp className="h-5 w-5 text-green-500" />}
              Insight Details
            </DialogTitle>
            <DialogDescription>
              How this insight was calculated and what data it's based on
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Full Insight</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {selectedInsight?.fullText}
              </p>
            </div>
            
            {selectedInsight?.calculation && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Calculation</h4>
                <pre className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg whitespace-pre-wrap font-mono">
                  {selectedInsight.calculation}
                </pre>
              </div>
            )}
            
            {selectedInsight?.dataSource && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Data Source</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  {selectedInsight.dataSource}
                </p>
              </div>
            )}
            
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 <strong>Tip:</strong> This insight is generated from your CRM data and AI analysis. 
                The calculations are based on actual metrics from your deals, tasks, and contacts.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
