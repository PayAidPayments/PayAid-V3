'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, TrendingDown } from 'lucide-react'

interface AIScoreBadgeProps {
  score: number
  type?: 'deal' | 'contact' | 'lead'
  showIcon?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AIScoreBadge({ score, type = 'deal', showIcon = true, size = 'md' }: AIScoreBadgeProps) {
  // Normalize score to 0-100
  const normalizedScore = Math.min(100, Math.max(0, score))
  
  // Determine score category
  const getScoreCategory = (score: number) => {
    if (score >= 80) return { label: 'High', color: 'bg-green-100 text-green-700 border-green-300', iconColor: 'text-green-600' }
    if (score >= 60) return { label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-300', iconColor: 'text-amber-600' }
    if (score >= 40) return { label: 'Low', color: 'bg-orange-100 text-orange-700 border-orange-300', iconColor: 'text-orange-600' }
    return { label: 'Very Low', color: 'bg-red-100 text-red-700 border-red-300', iconColor: 'text-red-600' }
  }

  const category = getScoreCategory(normalizedScore)
  const scoreTypeLabel = type === 'deal' ? 'Win Probability' : type === 'contact' ? 'Engagement Score' : 'Conversion Score'
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <Badge
      variant="outline"
      className={`${category.color} ${sizeClasses[size]} border font-semibold flex items-center gap-1.5`}
      title={`AI ${scoreTypeLabel}: ${normalizedScore}% - ${category.label}`}
    >
      {showIcon && <Sparkles className={`h-3 w-3 ${category.iconColor}`} />}
      <span className="font-bold">{normalizedScore}</span>
      <span className="text-xs opacity-75">- {category.label}</span>
    </Badge>
  )
}

// Helper function to calculate AI score for deals
export function calculateDealScore(deal: any): number {
  if (!deal) return 0
  
  let score = 50 // Base score
  
  // Probability factor (0-30 points)
  if (deal.probability) {
    score += (deal.probability / 100) * 30
  }
  
  // Value factor (0-10 points)
  if (deal.value) {
    const valueTier = deal.value >= 100000 ? 10 : deal.value >= 50000 ? 7 : deal.value >= 10000 ? 5 : 3
    score += valueTier
  }
  
  // Stage factor (0-10 points)
  const stageScores: Record<string, number> = {
    'proposal': 10,
    'negotiation': 8,
    'qualified': 6,
    'contacted': 4,
    'new': 2,
  }
  if (deal.stage && stageScores[deal.stage.toLowerCase()]) {
    score += stageScores[deal.stage.toLowerCase()]
  }
  
  return Math.min(100, Math.round(score))
}

// Helper function to calculate AI score for contacts
export function calculateContactScore(contact: any): number {
  if (!contact) return 0
  
  let score = 50 // Base score
  
  // Likely to buy factor (0-25 points)
  if (contact.likelyToBuy) {
    score += 25
  }
  
  // Churn risk factor (0-15 points deduction)
  if (contact.churnRisk) {
    score -= 15
  }
  
  // Last contacted factor (0-10 points)
  if (contact.lastContactedAt) {
    const daysSinceContact = Math.floor((Date.now() - new Date(contact.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24))
    if (daysSinceContact < 7) score += 10
    else if (daysSinceContact < 30) score += 5
    else if (daysSinceContact > 90) score -= 5
  }
  
  // Stage factor (0-10 points)
  const stageScores: Record<string, number> = {
    'customer': 10,
    'qualified': 8,
    'contact': 6,
    'prospect': 4,
  }
  if (contact.stage && stageScores[contact.stage.toLowerCase()]) {
    score += stageScores[contact.stage.toLowerCase()]
  }
  
  return Math.min(100, Math.max(0, Math.round(score)))
}
