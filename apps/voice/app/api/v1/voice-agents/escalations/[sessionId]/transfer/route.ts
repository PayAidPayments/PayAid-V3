/**
 * POST /api/v1/voice-agents/escalations/[sessionId]/transfer
 * Queue supervisor callback for an escalation and optionally dial immediately.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { requestEscalationTransfer } from '@/lib/voice-agent/escalation-transfer'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { tenantId, userId } = await requireVoiceAccess(request, 'operate')
    const { sessionId } = await ctx.params
    const body = (await request.json().catch(() => ({}))) as { autoDial?: boolean }
    const result = await requestEscalationTransfer(prisma, {
      tenantId,
      sessionId,
      requestedByUserId: userId,
      autoDial: body.autoDial === true,
    })
    if (!result) {
      return NextResponse.json(
        { error: 'Session not found or no escalation handoff phone' },
        { status: 404 },
      )
    }
    return NextResponse.json({ ok: true, transfer: result })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[escalations/transfer] POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transfer failed' },
      { status: 500 },
    )
  }
}
