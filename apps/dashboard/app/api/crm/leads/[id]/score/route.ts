/**
 * Lead Scoring API Route
 * POST /api/crm/leads/[id]/score - Score a lead
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculateLeadScore, updateLeadScore } from '@/lib/ai/lead-scoring'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

/** POST /api/crm/leads/[id]/score - Score lead */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const { id } = await params
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:lead:score:${id}:${idempotencyKey}`)
      const existingScored = (existing?.afterSnapshot as { scored?: boolean } | null)?.scored
      if (existing && existingScored) {
        return NextResponse.json({ success: true, deduplicated: true }, { status: 200 })
      }
    }

    // Calculate and update lead score
    const scoreData = await calculateLeadScore(id, tenantId)
    await updateLeadScore(id, tenantId)

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:lead:score:${id}:${idempotencyKey}`, {
        lead_id: id,
        scored: true,
      })
    }

    return NextResponse.json({
      success: true,
      score: scoreData,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Score lead error:', error)
    return NextResponse.json(
      { error: 'Failed to score lead', message: error.message },
      { status: 500 }
    )
  }
}
