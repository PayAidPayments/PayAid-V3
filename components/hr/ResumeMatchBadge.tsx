'use client'

import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'

interface ResumeMatchBadgeProps {
  candidateId: string
  jobRequisitionId?: string
  fallbackScore?: number
}

export function ResumeMatchBadge({ candidateId, jobRequisitionId, fallbackScore }: ResumeMatchBadgeProps) {
  const { token } = useAuthStore()

  const { data: matchData, isLoading } = useQuery({
    queryKey: ['resume-match', candidateId, jobRequisitionId],
    queryFn: async () => {
      if (!jobRequisitionId) return null
      
      const res = await fetch(`/api/hr/recruitment/candidates/${candidateId}/match-score?jobRequisitionId=${jobRequisitionId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      if (!res.ok) return null
      return res.json()
    },
    enabled: !!jobRequisitionId,
  })

  const score = matchData?.matchScore ?? fallbackScore ?? 0
  const matchLevel = matchData?.matchLevel

  const getVariant = () => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'outline'
  }

  const getColor = () => {
    if (score >= 80) return 'text-green-700 dark:text-green-300'
    if (score >= 60) return 'text-blue-700 dark:text-blue-300'
    return 'text-gray-700 dark:text-gray-300'
  }

  if (isLoading && !fallbackScore) {
    return <Badge variant="outline">Calculating...</Badge>
  }

  return (
    <Badge variant={getVariant()} className={getColor()}>
      {score}% {matchLevel && `(${matchLevel})`}
    </Badge>
  )
}
