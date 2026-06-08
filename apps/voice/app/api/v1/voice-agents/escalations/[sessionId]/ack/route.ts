/**
 * POST /api/v1/voice-agents/escalations/[sessionId]/ack
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireVoiceRealtimeAccess } from '@/lib/voice-agent/entitlements'
import { acknowledgeEscalation } from '@/lib/voice-agent/supervisor-monitor'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { tenantId, userId } = await requireVoiceRealtimeAccess(request)
    const { sessionId } = await ctx.params
    const ok = await acknowledgeEscalation(prisma, {
      tenantId,
      sessionId,
      acknowledgedByUserId: userId,
    })
    if (!ok) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    return NextResponse.json({ ok: true, sessionId })
  } catch (error) {
    console.error('[escalations/ack] POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ack failed' },
      { status: 500 },
    )
  }
}
