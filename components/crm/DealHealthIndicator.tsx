'use client'

import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { formatINRForDisplay } from '@/lib/utils/formatINR'

interface DealHealthIndicatorProps {
  deal: {
    id: string
    name: string
    value: number
    stage: string
    probability: number
    expectedCloseDate?: string | Date
    lastActivityDate?: string | Date
    daysInStage?: number
  }
  showDetails?: boolean
}

export function DealHealthIndicator({ deal, showDetails = false }: DealHealthIndicatorProps) {
  const now = new Date()
  const expectedClose = deal.expectedCloseDate ? new Date(deal.expectedCloseDate) : null
  const lastActivity = deal.lastActivityDate ? new Date(deal.lastActivityDate) : null
  const daysSinceActivity = lastActivity ? Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)) : null
  const daysUntilClose = expectedClose ? Math.floor((expectedClose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null
  const daysInStage = deal.daysInStage || 0

  // Calculate health score (0-100)
  let healthScore = deal.probability || 0
  
  // Reduce score if deal is stale (no activity in 7+ days)
  if (daysSinceActivity && daysSinceActivity > 7) {
    healthScore -= Math.min(20, daysSinceActivity - 7)
  }
  
  // Reduce score if deal is in same stage for too long
  if (daysInStage > 30) {
    healthScore -= Math.min(15, (daysInStage - 30) / 2)
  }
  
  // Reduce score if close date is approaching/passed
  if (daysUntilClose !== null) {
    if (daysUntilClose < 0) {
      healthScore -= 25 // Overdue
    } else if (daysUntilClose < 7) {
      healthScore -= 10 // Approaching deadline
    }
  }
  
  healthScore = Math.max(0, Math.min(100, healthScore))

  // Determine health status
  let healthStatus: 'excellent' | 'good' | 'warning' | 'critical'
  let healthColor: string
  let healthIcon: React.ReactNode

  if (healthScore >= 80) {
    healthStatus = 'excellent'
    healthColor = 'bg-green-500'
    healthIcon = <CheckCircle className="w-4 h-4" />
  } else if (healthScore >= 60) {
    healthStatus = 'good'
    healthColor = 'bg-blue-500'
    healthIcon = <TrendingUp className="w-4 h-4" />
  } else if (healthScore >= 40) {
    healthStatus = 'warning'
    healthColor = 'bg-yellow-500'
    healthIcon = <AlertCircle className="w-4 h-4" />
  } else {
    healthStatus = 'critical'
    healthColor = 'bg-red-500'
    healthIcon = <TrendingDown className="w-4 h-4" />
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className={`w-3 h-3 rounded-full ${healthColor}`} />
        {showDetails && (
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            Health: {healthScore}%
          </div>
        )}
      </div>
      {showDetails && (
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Score: <span className="font-semibold">{healthScore}%</span>
          </span>
          {daysSinceActivity !== null && (
            <span className="text-gray-600 dark:text-gray-400">
              Last Activity: {daysSinceActivity} days ago
            </span>
          )}
          {daysInStage > 0 && (
            <span className="text-gray-600 dark:text-gray-400">
              In Stage: {daysInStage} days
            </span>
          )}
          {daysUntilClose !== null && (
            <span className={daysUntilClose < 0 ? 'text-red-600' : daysUntilClose < 7 ? 'text-yellow-600' : 'text-gray-600'}>
              Close: {daysUntilClose < 0 ? `${Math.abs(daysUntilClose)} days overdue` : `${daysUntilClose} days`}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
