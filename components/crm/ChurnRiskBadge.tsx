'use client'

import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Clock } from 'lucide-react'
import { format } from 'date-fns'

interface ChurnRiskBadgeProps {
  risk: number
  level: 'low' | 'medium' | 'high' | 'critical'
  reasons: string[]
  predictionDate?: Date | string
}

export function ChurnRiskBadge({
  risk,
  level,
  reasons,
  predictionDate,
}: ChurnRiskBadgeProps) {
  const getColor = () => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    }
  }

  const getIcon = () => {
    if (level === 'critical' || level === 'high') {
      return <AlertTriangle className="h-4 w-4" />
    }
    return null
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge className={getColor()}>
          {getIcon()}
          <span className="ml-1 capitalize">{level} Risk</span>
          <span className="ml-2">({Math.round(risk)}%)</span>
        </Badge>
      </div>
      
      {reasons.length > 0 && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <div className="font-medium mb-1">Risk Factors:</div>
          <ul className="list-disc list-inside space-y-1">
            {reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {predictionDate && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>
            Predicted churn date: {format(new Date(predictionDate), 'MMM dd, yyyy')}
          </span>
        </div>
      )}
    </div>
  )
}
