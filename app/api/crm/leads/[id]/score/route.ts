/**
 * Lead Scoring API Route
 * POST /api/crm/leads/[id]/score - Score a lead
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { calculateLeadScore, updateLeadScore } from '@/lib/ai/lead-scoring'

/** POST /api/crm/leads/[id]/score - Score lead */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    // Calculate and update lead score
    const scoreData = await calculateLeadScore(id, tenantId)
    await updateLeadScore(id, tenantId)

    return NextResponse.json({
      success: true,
      score: scoreData,
    })
  } catch (error: any) {
    console.error('Score lead error:', error)
    return NextResponse.json(
      { error: 'Failed to score lead', message: error.message },
      { status: 500 }
    )
  }
}
