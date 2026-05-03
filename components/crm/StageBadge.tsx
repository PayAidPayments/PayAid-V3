'use client'

import { Badge } from '@/components/ui/badge'
import { useTerms } from '@/lib/terminology/use-terms'

interface StageBadgeProps {
  stage: 'prospect' | 'contact' | 'customer' | string
  className?: string
}

export function StageBadge({ stage, className = '' }: StageBadgeProps) {
  const { term } = useTerms()
  // Normalize stage - handle both stage field and legacy type field
  const normalizedStage = stage?.toLowerCase() || 'prospect'
  
  // Map legacy types to stages
  const stageMap: Record<string, 'prospect' | 'contact' | 'customer'> = {
    'lead': 'prospect',
    'prospect': 'prospect',
    'contact': 'contact',
    'customer': 'customer',
  }
  
  const mappedStage = stageMap[normalizedStage] || 'prospect'
  
  const stageConfig = {
    prospect: {
      label: term('lead'),
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700',
      icon: '👋',
    },
    contact: {
      label: term('contact'),
      className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-700',
      icon: '💬',
    },
    customer: {
      label: term('customer'),
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700',
      icon: '✅',
    },
  }
  
  const config = stageConfig[mappedStage] || stageConfig.prospect
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.className} ${className} px-2 py-1 text-xs font-medium`}
    >
      <span className="mr-1">{config.icon}</span>
      {config.label}
    </Badge>
  )
}
