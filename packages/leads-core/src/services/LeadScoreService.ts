import type { LeadScoreBreakdown } from '../types'

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

export class LeadScoreService {
  computeAccountScore(input: {
    fitScore: number
    intentScore: number
    reachabilityScore: number
    sourceCoverageScore: number
    whyNow?: string[]
  }): LeadScoreBreakdown {
    const fitScore = clampScore(input.fitScore)
    const intentScore = clampScore(input.intentScore)
    const reachabilityScore = clampScore(input.reachabilityScore)
    const sourceCoverageScore = clampScore(input.sourceCoverageScore)

    const compositeScore = clampScore(
      fitScore * 0.4 + intentScore * 0.3 + reachabilityScore * 0.2 + sourceCoverageScore * 0.1,
    )

    return {
      fitScore,
      intentScore,
      reachabilityScore,
      compositeScore,
      whyNow: input.whyNow ?? [],
      recommendedChannel: reachabilityScore >= 70 ? 'email' : 'linkedin',
      recommendedAngle: intentScore >= 70 ? 'timing-driven outreach' : 'problem-fit outreach',
      explanationVersion: 'deterministic-v1',
    }
  }
}
