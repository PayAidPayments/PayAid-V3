'use client'

// Import from client-safe utility (doesn't import Prisma)
import { getScoreCategory } from '@/lib/ai-helpers/lead-scoring-client'

interface LeadScoringBadgeProps {
  score: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function LeadScoringBadge({
  score,
  showLabel = true,
  size = 'md',
}: LeadScoringBadgeProps) {
  const category = getScoreCategory(score)
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${category.color} ${sizeClasses[size]}`}
      title={`Lead Score: ${score}/100`}
    >
      <span>{category.icon}</span>
      {showLabel && <span>{category.label}</span>}
      <span className="font-semibold">{Math.round(score)}</span>
    </span>
  )
}

export function LeadScoreDisplay({ score }: { score: number }) {
  const category = getScoreCategory(score)

  return (
    <div className="flex items-center gap-2">
      <LeadScoringBadge score={score} />
      <div className="flex-1">
        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all ${
              category.category === 'hot'
                ? 'bg-green-500'
                : category.category === 'warm'
                ? 'bg-yellow-500'
                : 'bg-gray-400'
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>
    </div>
  )
}
