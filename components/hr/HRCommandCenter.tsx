'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Sparkles, Zap, Target, ChevronRight, AlertTriangle } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface HRSummary {
  headcount: number
  contractors: number
  turnover: number
  absentToday: number
  nextPayroll: string
  nextPayrollAmount: number
  complianceScore: number
  pendingReimbursements: number
  pendingReimbursementsAmount: number
  arrears: number
  avgEngagement: number
  okrCompletion: number
  trainingDue: number
  flightRisks?: Array<{ name: string; risk: number; reason: string }>
  hiringVelocity?: number
  overtimeRisk?: { team: string; risk: number }
  healthScore?: number
  healthScoreChange?: number
  aiInsights?: Array<{ text: string; impact: string }>
}

interface HRCommandCenterProps {
  tenantId: string
  stats: HRSummary | null
  userName?: string
}

export function HRCommandCenter({ tenantId, stats, userName }: HRCommandCenterProps) {
  const monthLabel = useMemo(() => {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  }, [])

  const nextActions = useMemo(() => {
    const actions: { text: string; href: string; priority: 'high' | 'medium' | 'low' }[] = []
    
    // Flight risk alerts
    if (stats?.flightRisks && stats.flightRisks.length > 0) {
      const highRisk = stats.flightRisks.filter(r => r.risk >= 80)
      if (highRisk.length > 0) {
        highRisk.slice(0, 2).forEach(risk => {
          actions.push({
            text: `${risk.name}: ${risk.risk}% flight risk (${risk.reason})`,
            href: `/hr/${tenantId}/Employees?highlight=${encodeURIComponent(risk.name)}`,
            priority: 'high',
          })
        })
      }
    }

    // Hiring velocity
    if (stats?.hiringVelocity !== undefined && stats.hiringVelocity > 10) {
      actions.push({
        text: `Hiring velocity: ${stats.hiringVelocity} days (target 10)`,
        href: `/hr/${tenantId}/Recruitment`,
        priority: 'medium',
      })
    }

    // Overtime risk
    if (stats?.overtimeRisk) {
      actions.push({
        text: `${stats.overtimeRisk.team}: +${stats.overtimeRisk.risk}% overtime risk`,
        href: `/hr/${tenantId}/Attendance`,
        priority: 'medium',
      })
    }

    // Pending reimbursements
    if (stats?.pendingReimbursements && stats.pendingReimbursements > 0) {
      actions.push({
        text: `${stats.pendingReimbursements} pending reimbursements (${formatINRForDisplay(stats.pendingReimbursementsAmount)})`,
        href: `/hr/${tenantId}/Reimbursements`,
        priority: 'medium',
      })
    }

    // Training due
    if (stats?.trainingDue && stats.trainingDue > 0) {
      actions.push({
        text: `${stats.trainingDue} employees due for training`,
        href: `/hr/${tenantId}/Performance`,
        priority: 'low',
      })
    }

    // Compliance score
    if (stats?.complianceScore !== undefined && stats.complianceScore < 95) {
      actions.push({
        text: `Compliance score: ${stats.complianceScore}% - review statutory filings`,
        href: `/hr/${tenantId}/Statutory-Compliance`,
        priority: 'high',
      })
    }

    // Default actions if no specific alerts
    if (actions.length === 0) {
      actions.push({
        text: 'Review next payroll run',
        href: `/hr/${tenantId}/Payroll-Runs`,
        priority: 'low',
      })
      actions.push({
        text: 'Check employee engagement trends',
        href: `/hr/${tenantId}/Reports`,
        priority: 'low',
      })
    }

    return actions.slice(0, 5)
  }, [tenantId, stats])

  const healthScore = stats?.healthScore ?? 78
  const healthScoreChange = stats?.healthScoreChange ?? 2

  return (
    <Card
      className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-white to-purple-50/30 dark:from-gray-900 dark:to-gray-800 border-l-4 border-blue-500 dark:border-blue-600"
      style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-900 dark:text-purple-100">
          <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          HR Command Center
          <span className="text-sm font-normal text-muted-foreground">
            – AI overview for {monthLabel}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100% - 80px)' }}>
        <p className="text-sm text-muted-foreground">
          {userName ? `Hi ${userName},` : ''} Here are your next best actions.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Next Best Actions</h3>
          </div>
          <ul className="space-y-2">
            {nextActions.map((action, index) => (
              <li key={index}>
                <Link
                  href={action.href}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${
                    action.priority === 'high'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700'
                      : action.priority === 'medium'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700'
                      : 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  {action.priority === 'high' && (
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  {action.priority !== 'high' && (
                    <ChevronRight className={`h-5 w-5 mt-0.5 flex-shrink-0 group-hover:translate-x-1 transition-transform ${
                      action.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  )}
                  <span className={`text-sm truncate ${
                    action.priority === 'high'
                      ? 'text-red-700 dark:text-red-300'
                      : action.priority === 'medium'
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {action.text}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-2 pt-4 border-t border-blue-100 dark:border-blue-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-gray-900 dark:text-gray-100">Health Score</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{healthScore}/100</span>
              {healthScoreChange !== 0 && (
                <span className={`text-xs ${healthScoreChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {healthScoreChange > 0 ? '+' : ''}{healthScoreChange} MoM
                </span>
              )}
            </div>
          </div>
          <Progress value={healthScore} className="h-3" />
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Current: {healthScore}/100</span>
            <span>Target: 90+</span>
          </div>
        </div>

        {stats?.aiInsights && stats.aiInsights.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">AI Insights</h3>
            </div>
            <ul className="space-y-1">
              {stats.aiInsights.slice(0, 2).map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                  • {insight.text} <span className="text-xs text-muted-foreground">({insight.impact})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
