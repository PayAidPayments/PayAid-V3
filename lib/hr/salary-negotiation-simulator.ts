/**
 * Feature #3: Auto-Salary Negotiation Simulator
 * Market rate (internal by designation), internal equity, recommended offer range, budget impact.
 */
import { prisma } from '@/lib/db/prisma'
import { getMarketSalaryForDesignation } from '@/lib/hr/flight-risk-service'

export interface NegotiationInput {
  tenantId: string
  designationId: string | null
  departmentId?: string | null
  currentOfferInr?: number | null
  experienceYears?: number | null
  isInternalCandidate?: boolean
  budgetMaxInr?: number | null
}

export interface NegotiationResult {
  marketRateInr: number
  internalEquity: { minInr: number; maxInr: number; peerCount: number; message: string }
  recommendedRange: { minInr: number; maxInr: number; justification: string }
  budgetImpact: { withinBudget: boolean; gapInr?: number; message: string }
  retentionVsHireNote: string
}

export async function runSalaryNegotiationSimulator(
  input: NegotiationInput
): Promise<NegotiationResult> {
  const current = input.currentOfferInr ?? 0
  const marketRateInr = await getMarketSalaryForDesignation(
    input.tenantId,
    input.designationId,
    current || 500000
  )

  let peerCount = 0
  let minInr = marketRateInr * 0.85
  let maxInr = marketRateInr * 1.15
  let equityMessage = 'No peers in same designation for internal equity.'

  if (input.designationId) {
    const peers = await prisma.employee.findMany({
      where: {
        tenantId: input.tenantId,
        designationId: input.designationId,
        status: 'ACTIVE',
        ctcAnnualInr: { not: null },
      },
      select: { ctcAnnualInr: true },
    })
    peerCount = peers.length
    if (peers.length >= 2) {
      const ctcs = peers.map((p) => Number(p.ctcAnnualInr!))
      minInr = Math.min(...ctcs)
      maxInr = Math.max(...ctcs)
      const avg = ctcs.reduce((a, b) => a + b, 0) / ctcs.length
      equityMessage = `Internal range for ${peers.length} peers: ₹${Math.round(minInr / 100000) / 10}L–₹${Math.round(maxInr / 100000) / 10}L (avg ₹${Math.round(avg / 100000) / 10}L).`
    }
  }

  const recommendedMin = Math.round(Math.max(marketRateInr * 0.9, minInr * 0.95))
  const recommendedMax = Math.round(Math.min(marketRateInr * 1.1, maxInr * 1.05))
  const justification =
    current > 0
      ? `Current offer ₹${(current / 100000).toFixed(1)}L. Market benchmark ₹${(marketRateInr / 100000).toFixed(1)}L. Recommended range aligns with internal equity and market.`
      : `Market benchmark ₹${(marketRateInr / 100000).toFixed(1)}L. Recommended range 90–110% of market with internal equity check.`

  const budgetMax = input.budgetMaxInr ?? recommendedMax * 1.2
  const withinBudget = recommendedMax <= budgetMax
  const gapInr = withinBudget ? undefined : recommendedMax - budgetMax
  const budgetMessage = withinBudget
    ? `Recommended max ₹${(recommendedMax / 100000).toFixed(1)}L is within budget ₹${(budgetMax / 100000).toFixed(1)}L.`
    : `Recommended max exceeds budget by ₹${gapInr ? (gapInr / 100000).toFixed(1) : 0}L. Consider revising budget or offer.`

  return {
    marketRateInr,
    internalEquity: { minInr, maxInr, peerCount, message: equityMessage },
    recommendedRange: { minInr: recommendedMin, maxInr: recommendedMax, justification },
    budgetImpact: { withinBudget, gapInr, message: budgetMessage },
    retentionVsHireNote:
      'Retention cost typically 50–75% of hire cost. Use recommended range for offers; internal moves can use mid-point.',
  }
}
