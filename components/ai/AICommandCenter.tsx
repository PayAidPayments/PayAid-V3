'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Target, TrendingUp, AlertTriangle, Zap, RefreshCw, ChevronRight, Info, ExternalLink, BarChart3, Users, Briefcase, CheckSquare2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/lib/stores/auth'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import Link from 'next/link'

interface AICommandCenterProps {
  tenantId?: string
  stats?: any
  timePeriod?: string
  userName?: string
}

interface ActionItem {
  text: string
  type: 'task' | 'deal' | 'lead' | 'contact' | 'revenue' | 'general'
  navigationUrl?: string
  dataSource: string
  supportingData: {
    label: string
    value: string | number
  }[]
  calculation?: string
}

/** Defer heavy /api/ai/insights so CRM dashboard stats & paint win the network/main thread first. */
function scheduleIdleTask(run: () => void, timeoutMs = 2500): () => void {
  if (typeof window === 'undefined') {
    run()
    return () => {}
  }
  const win = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, opts?: IdleRequestOptions) => number
    cancelIdleCallback?: (id: number) => void
  }
  let idleId: number | undefined
  let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined
  if (typeof win.requestIdleCallback === 'function') {
    idleId = win.requestIdleCallback(() => run(), { timeout: timeoutMs })
  } else {
    timeoutId = globalThis.setTimeout(run, 400)
  }
  return () => {
    if (idleId != null && typeof win.cancelIdleCallback === 'function') {
      win.cancelIdleCallback(idleId)
    }
    if (timeoutId != null) {
      globalThis.clearTimeout(timeoutId)
    }
  }
}

export function AICommandCenter({ tenantId, stats, timePeriod = 'month', userName }: AICommandCenterProps) {
  const [summary, setSummary] = useState<{
    greeting: string
    nextActions: ActionItem[]
    targetProgress: number
    targetRevenue: number
    currentRevenue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [expandedActionIndex, setExpandedActionIndex] = useState<number | null>(null)
  const { token } = useAuthStore()

  // `stats` from the parent is often a new object each render; depend on stable metrics only
  // so we do not re-fetch /api/ai/insights multiple times on open.
  const statsEffectKey = useMemo(() => {
    if (!stats) return 'empty'
    return [
      stats.revenueThisMonth ?? 0,
      stats.totalLeads ?? 0,
      stats.convertedLeads ?? 0,
      stats.activeDeals ?? 0,
      stats.forecastedRevenue ?? 0,
      stats.overdueTasks ?? 0,
      stats.dealsClosingThisMonth ?? 0,
      stats.atRiskContacts ?? 0,
    ].join('|')
  }, [
    stats?.revenueThisMonth,
    stats?.totalLeads,
    stats?.convertedLeads,
    stats?.activeDeals,
    stats?.forecastedRevenue,
    stats?.overdueTasks,
    stats?.dealsClosingThisMonth,
    stats?.atRiskContacts,
  ])

  const getPeriodLabel = () => {
    const now = new Date()
    if (timePeriod === 'month') {
      return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    } else if (timePeriod === 'quarter') {
      const quarter = Math.floor(now.getMonth() / 3) + 1
      return `Q${quarter} ${now.getFullYear()}`
    } else if (timePeriod === 'year') {
      return now.getFullYear().toString()
    }
    return 'this period'
  }

  const fetchSeqRef = useRef(0)

  useEffect(() => {
    if (!tenantId || !token) {
      setLoading(false)
      // Generate fallback summary from stats
      if (stats) {
        generateFallbackSummary()
      }
      return
    }

    const seq = ++fetchSeqRef.current
    let cancelled = false
    const run = async () => {
      if (cancelled || seq !== fetchSeqRef.current) return
      try {
        await fetchAIInsights()
      } catch (err) {
        if (cancelled || seq !== fetchSeqRef.current) return
        const message = err instanceof Error ? err.message : String(err)
        console.warn('[AICommandCenter] Insights fetch failed, using fallback:', message)
        try {
          generateFallbackSummary()
        } finally {
          setLoading(false)
        }
      }
    }

    const cancelIdle = scheduleIdleTask(() => {
      if (!cancelled && seq === fetchSeqRef.current) void run()
    })

    return () => {
      cancelled = true
      cancelIdle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, token, timePeriod, statsEffectKey])

  // Parse action text and create ActionItem with metadata.
  // insightsMetrics: from same API that generated the action text, so supporting data matches the narrative.
  const parseAction = (
    actionText: string,
    targetRevenue?: number,
    targetProgress?: number,
    insightsMetrics?: {
      pendingInvoices?: number
      totalPendingAmount?: number
      overdueInvoices?: number
      overdueAmount?: number
      overdueTasks?: number
      totalTasks?: number
      pendingTasks?: number
      dealsClosingSoonCount?: number
      dealsClosingSoonValue?: number
      highValueClosingCount?: number
      highValueClosingValue?: number
      dealsClosingThisMonthCount?: number
      dealsClosingThisMonthValue?: number
      activeDeals?: number
      forecastedRevenue?: number
      totalRevenue?: number
    }
  ): ActionItem => {
    const lowerText = actionText.toLowerCase()
    
    // Parse pending / overdue invoices (e.g. "Follow up on 7 pending invoice(s) worth ₹... to ensure timely payment")
    // Use insightsMetrics first so Supporting Data matches the same source as the action text.
    if ((lowerText.includes('pending invoice') || lowerText.includes('invoice') && (lowerText.includes('follow up') || lowerText.includes('payment') || lowerText.includes('cash flow')))) {
      const pendingCount = insightsMetrics?.pendingInvoices ?? stats?.pendingInvoices ?? stats?.pendingCount ?? 0
      const overdueCount = insightsMetrics?.overdueInvoices ?? stats?.overdueInvoices ?? 0
      const isOverdue = lowerText.includes('overdue')
      return {
        text: actionText,
        type: 'revenue',
        navigationUrl: tenantId
          ? isOverdue
            ? `/finance/${tenantId}/Invoices?status=overdue`
            : `/finance/${tenantId}/Invoices?status=sent`
          : undefined,
        dataSource: 'Finance / AI Insights - Pending or overdue invoices',
        supportingData: [
          { label: 'Pending Invoices', value: pendingCount },
          { label: 'Overdue Invoices', value: overdueCount },
        ],
        calculation: 'Invoices not yet paid (sent) or past due date',
      }
    }
    if (lowerText.includes('overdue') && lowerText.includes('invoice')) {
      const overdueCount = insightsMetrics?.overdueInvoices ?? stats?.overdueInvoices ?? 0
      const overdueAmount = insightsMetrics?.overdueAmount ?? stats?.overdueAmount ?? 0
      return {
        text: actionText,
        type: 'revenue',
        navigationUrl: tenantId ? `/finance/${tenantId}/Invoices?status=overdue` : undefined,
        dataSource: 'Finance - Overdue invoices',
        supportingData: [
          { label: 'Overdue Invoices', value: overdueCount },
          { label: 'Overdue Amount', value: formatINRForDisplay(overdueAmount) },
        ],
        calculation: 'Invoices past due date',
      }
    }
    
    // Parse overdue tasks – use insightsMetrics so Supporting Data matches narrative
    if (lowerText.includes('overdue task') || (lowerText.includes('task') && lowerText.includes('overdue'))) {
      const taskCount = insightsMetrics?.overdueTasks ?? stats?.overdueTasks ?? 0
      const total = insightsMetrics?.totalTasks ?? stats?.totalTasks ?? 0
      const pending = insightsMetrics?.pendingTasks ?? stats?.totalTasks ?? 0
      const completionRate = total > 0 ? Math.round(((total - pending) / total) * 100) : 0
      return {
        text: actionText,
        type: 'task',
        navigationUrl: tenantId ? `/crm/${tenantId}/Tasks?filter=overdue` : undefined,
        dataSource: 'Finance / AI Insights - Overdue tasks count',
        supportingData: [
          { label: 'Overdue Tasks', value: taskCount },
          { label: 'Total Tasks', value: total },
          { label: 'Completion Rate', value: `${Math.min(100, Math.max(0, completionRate))}%` }
        ],
        calculation: `Found ${taskCount} task${taskCount !== 1 ? 's' : ''} with due date in the past and status not "completed"`
      }
    }
    
    // Parse active deals / forecasted revenue FIRST so "67 active deal(s) ... forecasted revenue" matches this, not "deals closing"
    if (lowerText.includes('active deal') || lowerText.includes('forecasted revenue')) {
      const activeDeals = insightsMetrics?.activeDeals ?? stats?.activeDeals ?? 0
      const forecastedRevenue = insightsMetrics?.forecastedRevenue ?? stats?.forecastedRevenue ?? 0
      return {
        text: actionText,
        type: 'deal',
        navigationUrl: tenantId ? `/crm/${tenantId}/Deals` : undefined,
        dataSource: 'Finance / AI Insights - Active deals and forecasted revenue',
        supportingData: [
          { label: 'Active Deals', value: activeDeals },
          { label: 'Forecasted Revenue', value: formatINRForDisplay(forecastedRevenue) },
          { label: 'Avg Deal Value', value: activeDeals > 0 ? formatINRForDisplay(Math.round(forecastedRevenue / activeDeals)) : '₹0' }
        ],
        calculation: `Calculated from ${activeDeals} active deal${activeDeals !== 1 ? 's' : ''} with total forecasted value of ${formatINRForDisplay(forecastedRevenue)}`
      }
    }
    
    // Parse deals closing (high-value closing soon vs current month – use same source as narrative)
    if (lowerText.includes('deal') && (lowerText.includes('closing') || lowerText.includes('close'))) {
      const isHighValue = lowerText.includes('high-value') || lowerText.includes('80%')
      const dealsClosing = isHighValue
        ? (insightsMetrics?.highValueClosingCount ?? stats?.dealsClosingThisMonth ?? 0)
        : (insightsMetrics?.dealsClosingThisMonthCount ?? insightsMetrics?.dealsClosingSoonCount ?? stats?.dealsClosingThisMonth ?? 0)
      const dealsValue = isHighValue
        ? (insightsMetrics?.highValueClosingValue ?? stats?.dealsClosingValue ?? 0)
        : (insightsMetrics?.dealsClosingThisMonthValue ?? insightsMetrics?.dealsClosingSoonValue ?? stats?.dealsClosingValue ?? 0)
      return {
        text: actionText,
        type: 'deal',
        navigationUrl: tenantId ? `/crm/${tenantId}/Deals?category=closing&timePeriod=${timePeriod}` : undefined,
        dataSource: 'Finance / AI Insights - Deals with expectedCloseDate in current period',
        supportingData: [
          { label: 'Deals Closing', value: dealsClosing },
          { label: 'Total Value', value: formatINRForDisplay(dealsValue) },
          { label: 'Avg Deal Value', value: dealsClosing > 0 ? formatINRForDisplay(Math.round(dealsValue / dealsClosing)) : '₹0' }
        ],
        calculation: `Identified ${dealsClosing} deal${dealsClosing !== 1 ? 's' : ''} with expectedCloseDate in ${getPeriodLabel()}`
      }
    }
    
    // Parse leads/contacts
    if (lowerText.includes('lead') || lowerText.includes('unconverted')) {
      const totalLeads = stats?.totalLeads || 0
      const convertedLeads = stats?.convertedLeads || 0
      const unconverted = totalLeads - convertedLeads
      return {
        text: actionText,
        type: 'lead',
        navigationUrl: tenantId ? `/crm/${tenantId}/Contacts?filter=leads` : undefined,
        dataSource: 'Dashboard Stats API - Total leads and converted leads',
        supportingData: [
          { label: 'Total Leads', value: totalLeads },
          { label: 'Converted', value: convertedLeads },
          { label: 'Unconverted', value: unconverted },
          { label: 'Conversion Rate', value: totalLeads > 0 ? `${Math.round((convertedLeads / totalLeads) * 100)}%` : '0%' }
        ],
        calculation: `Found ${unconverted} unconverted lead${unconverted !== 1 ? 's' : ''} out of ${totalLeads} total (${totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0}% converted)`
      }
    }
    
    // Parse revenue/target – use insightsMetrics when available
    if (lowerText.includes('revenue') || lowerText.includes('target')) {
      const currentRevenue = insightsMetrics?.totalRevenue ?? stats?.revenueThisMonth ?? 0
      const defaultTarget = 1000000
      const calculatedTarget = targetRevenue || (currentRevenue > 0 ? Math.max(defaultTarget, currentRevenue * 4) : defaultTarget)
      const calculatedProgress = targetProgress !== undefined ? targetProgress : Math.min(100, Math.round((currentRevenue / calculatedTarget) * 100))
      return {
        text: actionText,
        type: 'revenue',
        navigationUrl: tenantId ? `/crm/${tenantId}/Deals?category=won&timePeriod=${timePeriod}` : undefined,
        dataSource: 'Dashboard Stats API - Revenue from won deals',
        supportingData: [
          { label: 'Current Revenue', value: formatINRForDisplay(currentRevenue) },
          { label: 'Target Revenue', value: formatINRForDisplay(calculatedTarget) },
          { label: 'Progress', value: `${calculatedProgress}%` }
        ],
        calculation: `Revenue calculated from all deals with status "won" and closedDate in ${getPeriodLabel()}`
      }
    }
    
    // Default/general action
    return {
      text: actionText,
      type: 'general',
      dataSource: 'AI Analysis - General recommendation',
      supportingData: [],
      calculation: 'Generated from overall business metrics and patterns'
    }
  }

  const generateFallbackSummary = () => {
    const currentRevenue = stats?.revenueThisMonth || 0
    const defaultTarget = 1000000 // ₹10 Lakh default target
    const smartTarget = currentRevenue > 0 ? Math.max(defaultTarget, currentRevenue * 4) : defaultTarget
    const targetProgress = Math.min(100, Math.round((currentRevenue / smartTarget) * 100))

    const nextActions: ActionItem[] = []
    
    // Generate next actions based on stats
    if (stats?.overdueTasks > 0) {
      nextActions.push(parseAction(`Address ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? 's' : ''} to maintain customer satisfaction`, smartTarget, targetProgress))
    }
    
    if (stats?.dealsClosingThisMonth > 0) {
      const highValueDeals = stats?.dealsClosingThisMonth || 0
      nextActions.push(parseAction(`Follow up on ${highValueDeals} deal${highValueDeals > 1 ? 's' : ''} closing this month to ensure timely closure`, smartTarget, targetProgress))
    }
    
    if (stats?.activeDeals > 0) {
      nextActions.push(parseAction(`Focus on closing ${stats.activeDeals} active deal${stats.activeDeals > 1 ? 's' : ''} to realize ₹${formatINRForDisplay(stats?.forecastedRevenue || 0)} in forecasted revenue`, smartTarget, targetProgress))
    }
    
    if (stats?.totalLeads > 0 && stats?.convertedLeads < stats.totalLeads * 0.3) {
      nextActions.push(parseAction(`Engage with ${stats.totalLeads - (stats.convertedLeads || 0)} unconverted leads to improve conversion rate`, smartTarget, targetProgress))
    }

    // Default actions if none generated
    if (nextActions.length === 0) {
      nextActions.push(parseAction('Create new deals to build your pipeline', smartTarget, targetProgress))
      nextActions.push(parseAction('Follow up with leads to convert them to opportunities', smartTarget, targetProgress))
      nextActions.push(parseAction('Schedule regular check-ins with your team', smartTarget, targetProgress))
    }

    const greeting = `Good ${getTimeOfDay()}, ${userName || 'there'} – AI overview for ${getPeriodLabel()}`

    setSummary({
      greeting,
      nextActions: nextActions.slice(0, 5), // Limit to 5 actions
      targetProgress,
      targetRevenue: smartTarget,
      currentRevenue,
    })
    setLoading(false)
  }

  const getTimeOfDay = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'morning'
    if (hour < 17) return 'afternoon'
    return 'evening'
  }

  const fetchAIInsights = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ai/insights?tenantId=${tenantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        const insights = data.insights || {}
        const metrics = data.metrics || {}
        // Use same metrics that produced the action text so Supporting Data matches the narrative
        const insightsMetrics = {
          pendingInvoices: metrics.pendingInvoices,
          totalPendingAmount: metrics.totalPendingAmount,
          overdueInvoices: metrics.overdueInvoices,
          overdueAmount: metrics.overdueAmount,
          overdueTasks: metrics.overdueTasks,
          totalTasks: metrics.totalTasks,
          pendingTasks: metrics.pendingTasks,
          dealsClosingSoonCount: metrics.dealsClosingSoonCount,
          dealsClosingSoonValue: metrics.dealsClosingSoonValue,
          highValueClosingCount: metrics.highValueClosingCount,
          highValueClosingValue: metrics.highValueClosingValue,
          dealsClosingThisMonthCount: metrics.dealsClosingThisMonthCount,
          dealsClosingThisMonthValue: metrics.dealsClosingThisMonthValue,
          activeDeals: metrics.activeDeals,
          forecastedRevenue: metrics.forecastedRevenue,
          totalRevenue: metrics.totalRevenue,
        }
        
        const currentRevenue = stats?.revenueThisMonth || 0
        const defaultTarget = 1000000
        const smartTarget = currentRevenue > 0 ? Math.max(defaultTarget, currentRevenue * 4) : defaultTarget
        const targetProgress = Math.min(100, Math.round((currentRevenue / smartTarget) * 100))

        // Build next actions from AI insights
        const nextActions: ActionItem[] = []
        
        // Add urgent actions first
        if (insights.urgentActions && Array.isArray(insights.urgentActions)) {
          insights.urgentActions.slice(0, 2).forEach((action: string) => {
            nextActions.push(parseAction(action, smartTarget, targetProgress, insightsMetrics))
          })
        }
        
        // Add opportunities
        if (insights.opportunities && Array.isArray(insights.opportunities)) {
          insights.opportunities.slice(0, 2).forEach((opp: string) => {
            nextActions.push(parseAction(opp, smartTarget, targetProgress, insightsMetrics))
          })
        }
        
        // Add recommendations
        if (insights.recommendations && Array.isArray(insights.recommendations)) {
          insights.recommendations.slice(0, 1).forEach((rec: string) => {
            nextActions.push(parseAction(rec, smartTarget, targetProgress, insightsMetrics))
          })
        }

        // Fallback to rule-based if no AI insights
        if (nextActions.length === 0) {
          generateFallbackSummary()
          return
        }

        const greeting = `Good ${getTimeOfDay()}, ${userName || 'there'} – AI overview for ${getPeriodLabel()}`

        setSummary({
          greeting,
          nextActions: nextActions.slice(0, 5),
          targetProgress,
          targetRevenue: smartTarget,
          currentRevenue,
        })
      } else {
        generateFallbackSummary()
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.warn('[AICommandCenter] Insights unavailable, using fallback:', err.message)
      generateFallbackSummary()
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    await fetchAIInsights()
    setTimeout(() => setIsRegenerating(false), 500)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-white to-purple-50/30 border-l-4 border-purple-500">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-white to-purple-50/30 border-l-4 border-purple-500" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-900">
            <Sparkles className="h-6 w-6 text-purple-600" />
            AI Command Center
            <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-700 border-purple-300">
              Live
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="text-purple-600 hover:text-purple-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
        {/* Greeting */}
        <div>
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {summary.greeting}
          </p>
        </div>

        {/* Next Best Actions */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Next Best Actions</h3>
          </div>
          <ul className="space-y-2">
            {summary.nextActions.map((action, index) => {
              const isExpanded = expandedActionIndex === index
              const ActionContent = action.navigationUrl ? (
                <Link 
                  href={action.navigationUrl}
                  className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group"
                >
                  <ChevronRight className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 block">{action.text}</span>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800 space-y-2"
                      >
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                          <p className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Supporting Data:</p>
                          {action.supportingData.map((data, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400 min-w-[100px] flex-shrink-0">{data.label}:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{data.value}</span>
                            </div>
                          ))}
                        </div>
                        {action.calculation && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-purple-100 dark:border-purple-800">
                            <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">How AI calculated this:</p>
                            <p className="italic">{action.calculation}</p>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 pt-1">
                          <p>Data Source: {action.dataSource}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
                      title="View supporting data"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setExpandedActionIndex(isExpanded ? null : index)
                      }}
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                    <ExternalLink className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ) : (
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900">
                  <ChevronRight className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 block">{action.text}</span>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-purple-100 dark:border-purple-800 space-y-2"
                      >
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1.5">
                          <p className="font-semibold text-purple-700 dark:text-purple-300 mb-2">Supporting Data:</p>
                          {action.supportingData.map((data, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-400 min-w-[100px] flex-shrink-0">{data.label}:</span>
                              <span className="font-medium text-gray-900 dark:text-gray-100">{data.value}</span>
                            </div>
                          ))}
                        </div>
                        {action.calculation && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-purple-100 dark:border-purple-800">
                            <p className="font-semibold text-purple-700 dark:text-purple-300 mb-1">How AI calculated this:</p>
                            <p className="italic">{action.calculation}</p>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-500 pt-1">
                          <p>Data Source: {action.dataSource}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-100 dark:hover:bg-purple-900"
                    title="View supporting data"
                    onClick={() => setExpandedActionIndex(isExpanded ? null : index)}
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                </div>
              )

              return (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {ActionContent}
                </motion.li>
              )
            })}
          </ul>
        </div>

        {/* Monthly Target Progress */}
        <Link
          href={tenantId ? `/crm/${tenantId}/Deals?category=won&timePeriod=${timePeriod}` : '#'}
          className="block space-y-2 pt-4 border-t border-purple-100 dark:border-purple-900 rounded-lg hover:bg-purple-50/40 dark:hover:bg-purple-900/20 transition-colors"
          title="Open won deals backing target progress"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Monthly Target Progress</span>
            </div>
            <span className="text-sm font-medium text-purple-600">
              {summary.targetProgress}%
            </span>
          </div>
          <Progress value={summary.targetProgress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Current: {formatINRForDisplay(summary.currentRevenue)}</span>
            <span>Target: {formatINRForDisplay(summary.targetRevenue)}</span>
          </div>
        </Link>

        {/* Micro-KPIs – equal width, no empty space */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-purple-100 dark:border-purple-900 min-w-0">
          {/* Win Rate */}
          {tenantId ? (
            <Link href={`/crm/${tenantId}/Contacts?filter=converted`} className="block min-w-0" title="Click to view converted contacts - Calculation: (Converted Leads / Total Leads) × 100">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group min-w-0">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <BarChart3 className="h-3 w-3 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Win Rate</p>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats?.totalLeads && stats?.convertedLeads
                    ? `${Math.round((stats.convertedLeads / stats.totalLeads) * 100)}%`
                    : '0%'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats?.convertedLeads || 0} / {stats?.totalLeads || 0} leads
                </p>
              </div>
            </Link>
          ) : (
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Win Rate</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats?.totalLeads && stats?.convertedLeads
                  ? `${Math.round((stats.convertedLeads / stats.totalLeads) * 100)}%`
                  : '0%'}
              </p>
            </div>
          )}
          
          {/* Avg Deal Size */}
          {tenantId ? (
            <Link href={`/crm/${tenantId}/Deals`} className="block min-w-0" title="Click to view all deals - Calculation: Forecasted Revenue / Active Deals">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group min-w-0">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Briefcase className="h-3 w-3 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Avg Deal Size</p>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {stats?.activeDeals && stats?.forecastedRevenue
                    ? formatINRForDisplay(Math.round(stats.forecastedRevenue / stats.activeDeals))
                    : '₹0'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stats?.activeDeals || 0} active deals
                </p>
              </div>
            </Link>
          ) : (
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Deal Size</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats?.activeDeals && stats?.forecastedRevenue
                  ? formatINRForDisplay(Math.round(stats.forecastedRevenue / stats.activeDeals))
                  : '₹0'}
              </p>
            </div>
          )}
          
          {/* Churn Risk */}
          {tenantId ? (
            <Link href={`/crm/${tenantId}/Contacts?filter=at-risk`} className="block min-w-0" title="Click to view at-risk contacts - Based on inactivity and engagement patterns">
              <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all cursor-pointer group min-w-0">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <AlertTriangle className="h-3 w-3 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="text-xs text-gray-600 dark:text-gray-400">Churn Risk</p>
                </div>
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  {stats?.atRiskContacts ? `${stats.atRiskContacts}` : '0'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  contacts at risk
                </p>
              </div>
            </Link>
          ) : (
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-purple-100 dark:border-purple-900 min-w-0">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Churn Risk</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stats?.atRiskContacts ? `${stats.atRiskContacts}` : '0'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
