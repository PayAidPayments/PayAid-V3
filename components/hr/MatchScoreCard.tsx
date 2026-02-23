'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/stores/auth'
import { Sparkles, AlertCircle } from 'lucide-react'

interface MatchScoreCardProps {
  candidateId: string
  jobRequisitionId: string | null
  jobRequisitions: Array<{ id: string; title: string }>
  onSelectJob?: (id: string) => void
}

export function MatchScoreCard({
  candidateId,
  jobRequisitionId,
  jobRequisitions,
  onSelectJob,
}: MatchScoreCardProps) {
  const { token } = useAuthStore()

  const { data, isLoading, error } = useQuery({
    queryKey: ['resume-match-score', candidateId, jobRequisitionId],
    queryFn: async () => {
      if (!jobRequisitionId) return null
      const res = await fetch(
        `/api/hr/recruitment/candidates/${candidateId}/match-score?jobRequisitionId=${jobRequisitionId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!res.ok) throw new Error('Failed to fetch match score')
      return res.json()
    },
    enabled: !!jobRequisitionId,
  })

  if (jobRequisitions.length === 0) {
    return (
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg dark:text-gray-100">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Resume match score
          </CardTitle>
          <CardDescription className="dark:text-gray-400">
            Apply this candidate to a job to see match score.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const score = data?.matchScore ?? 0
  const matchLevel = data?.matchLevel
  const getScoreColor = () => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 60) return 'text-blue-600 dark:text-blue-400'
    if (score >= 40) return 'text-amber-600 dark:text-amber-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg dark:text-gray-100">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Resume match score
        </CardTitle>
        <CardDescription className="dark:text-gray-400">
          Match vs selected job requisition
        </CardDescription>
        {jobRequisitions.length > 0 && (
          <select
            className="mt-2 w-full max-w-xs rounded-md border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 px-3 py-2 text-sm"
            value={jobRequisitionId || ''}
            onChange={(e) => onSelectJob?.(e.target.value)}
          >
            <option value="">Select job...</option>
            {jobRequisitions.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!jobRequisitionId ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a job above to see match score.</p>
        ) : isLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Calculating...</p>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">Could not load match score.</p>
        ) : data ? (
          <>
            <div className="flex items-center gap-3">
              <span className={`text-3xl font-bold ${getScoreColor()}`}>{score}%</span>
              <Badge variant={score >= 60 ? 'default' : 'secondary'}>{matchLevel}</Badge>
            </div>
            {data.factors && data.factors.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Breakdown</p>
                <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  {data.factors.map((f: { factor: string; score: number; maxScore: number }, i: number) => (
                    <li key={i}>
                      {f.factor}: {f.score}/{f.maxScore}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.skillGaps && data.skillGaps.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" /> Skill gaps
                </p>
                <div className="flex flex-wrap gap-1">
                  {data.skillGaps.map((g: string, i: number) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}
