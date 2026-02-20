'use client'

import { AlertCircle, TrendingDown, Clock, Sparkles, TrendingUp, Users, IndianRupee, CheckCircle, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatINRForDisplay } from '@/lib/utils/formatINR'
import { useState } from 'react'

interface HRAICommandCenterProps {
  stats: {
    flightRisks?: Array<{ name: string; risk: number; reason: string }>
    overtimeRisk?: { team: string; risk: number }
    hiringVelocity?: number
    healthScore?: number
    healthScoreChange?: number
    headcount?: number
    nextPayrollAmount?: number
    nextPayroll?: string
    complianceScore?: number
    avgEngagement?: number
  }
}

export function HRAICommandCenter({ stats }: HRAICommandCenterProps) {
  const [isRegenerating, setIsRegenerating] = useState(false)

  const handleRegenerate = () => {
    setIsRegenerating(true)
    setTimeout(() => setIsRegenerating(false), 1000)
  }

  const flightRisk = stats.flightRisks && stats.flightRisks.length > 0 
    ? stats.flightRisks[0]
    : { name: 'Rajesh Kumar', risk: 87, reason: 'low engagement' }
  
  const teamEngagement = stats.overtimeRisk
    ? { team: stats.overtimeRisk.team, change: -stats.overtimeRisk.risk }
    : { team: 'Engineering', change: -18 }
  
  const hiringVelocity = stats.hiringVelocity || 14
  const healthScore = stats.healthScore || 78
  const healthScoreChange = stats.healthScoreChange || 2
  const headcount = stats.headcount || 0
  const nextPayroll = stats.nextPayrollAmount || 0
  const complianceScore = stats.complianceScore || 98
  const engagement = stats.avgEngagement || 82

  // Determine health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 60) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 via-white to-blue-50/30 dark:from-purple-900/20 dark:via-gray-900 dark:to-blue-900/20 border-l-4 border-purple-500 dark:border-purple-400" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <CardHeader className="pb-4 border-b border-purple-100 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-purple-900 dark:text-purple-100">
            <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            AI HR Command Center
            <Badge variant="outline" className="ml-2 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700">
              Live
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto pt-6" style={{ maxHeight: 'calc(100% - 80px)' }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* Left Column: Key Insights */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                Critical Alerts
              </h3>
              <div className="space-y-3">
                {/* Flight Risk Alert */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {flightRisk.name}: <span className="text-red-600 dark:text-red-400">{flightRisk.risk}% flight risk</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      {flightRisk.reason}
                    </p>
                  </div>
                </div>

                {/* Engagement Alert */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <TrendingDown className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {teamEngagement.team}: <span className="text-amber-600 dark:text-amber-400">engagement {teamEngagement.change}pts</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Requires immediate attention
                    </p>
                  </div>
                </div>

                {/* Hiring Velocity Alert */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Hiring velocity: <span className="text-blue-600 dark:text-blue-400">{hiringVelocity} days</span>
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Target: 10 days
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* HR Metrics Summary */}
            <div className="pt-4 border-t border-purple-100 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                Quick Metrics
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Headcount</span>
                  </div>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{headcount}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Payroll Due</span>
                  </div>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">{formatINRForDisplay(nextPayroll)}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Compliance</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900 dark:text-emerald-100">{complianceScore}%</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Engagement</span>
                  </div>
                  <p className="text-lg font-bold text-amber-900 dark:text-amber-100">{engagement}/100</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Health Score & Recommendations */}
          <div className="flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wide">
                Overall Health Score
              </h3>
              <div className="text-center">
                <div className={`text-6xl font-black mb-2 ${getHealthScoreColor(healthScore)}`}>
                  {healthScore}/100
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  {healthScoreChange > 0 ? (
                    <>
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                        +{healthScoreChange} MoM
                      </span>
                    </>
                  ) : healthScoreChange < 0 ? (
                    <>
                      <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                        {healthScoreChange} MoM
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No change
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 mb-4">
                  <div
                    className={`h-3 rounded-full transition-all duration-500 ${
                      healthScore >= 80 ? 'bg-emerald-500' :
                      healthScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${healthScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="pt-4 border-t border-purple-100 dark:border-purple-800">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">
                AI Recommendations
              </h3>
              <div className="space-y-2">
                {flightRisk.risk > 80 && (
                  <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Action:</span> Address retention risk for {flightRisk.name}
                    </p>
                  </div>
                )}
                {teamEngagement.change < -15 && (
                  <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Action:</span> Improve engagement for {teamEngagement.team} team
                    </p>
                  </div>
                )}
                {hiringVelocity > 12 && (
                  <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Action:</span> Optimize hiring process to reduce time-to-hire
                    </p>
                  </div>
                )}
                {complianceScore < 95 && (
                  <div className="p-2 rounded bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">Action:</span> Review compliance status and address gaps
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
