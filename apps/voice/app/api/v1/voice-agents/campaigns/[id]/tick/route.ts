/**
 * POST /api/v1/voice-agents/campaigns/[id]/tick
 * Pick up the next pending contact on a running campaign (sequential dialer).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { pickupNextCampaignContact } from '@/lib/voice-agent/campaign-dialer'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'operate')
    const { id } = await ctx.params
    const result = await pickupNextCampaignContact(prisma, { tenantId, campaignId: id })
    return NextResponse.json({ ok: true, result })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[campaigns/tick] POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Tick failed' },
      { status: 500 },
    )
  }
}
