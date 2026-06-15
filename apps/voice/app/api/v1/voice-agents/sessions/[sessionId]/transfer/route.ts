/**
 * POST /api/v1/voice-agents/sessions/[sessionId]/transfer
 * Initiate in-call PSTN transfer for an active browser-live session.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { initiateInCallTransfer } from '@/lib/voice-agent/in-call-transfer'

export const runtime = 'nodejs'

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'operate')
    const { sessionId } = await ctx.params
    const body = (await request.json().catch(() => ({}))) as {
      supervisorPhone?: string
      summary?: string
    }

    const session = await prisma.voiceDemoSession.findFirst({
      where: { id: sessionId, tenantId, status: 'active' },
      include: { agent: { select: { phoneNumber: true } } },
    })
    if (!session) {
      return NextResponse.json({ error: 'Active session not found' }, { status: 404 })
    }

    const meta =
      session.metadataJson && typeof session.metadataJson === 'object' && !Array.isArray(session.metadataJson)
        ? (session.metadataJson as Record<string, unknown>)
        : {}
    const callerPhone = typeof meta.callerPhone === 'string' ? meta.callerPhone : null

    const transfer = await initiateInCallTransfer(prisma, {
      tenantId,
      agentId: session.voiceAgentId,
      sessionId,
      callerPhone,
      supervisorPhone: body.supervisorPhone,
      summary: body.summary,
      fromPhone: session.agent?.phoneNumber,
    })
    if (!transfer) {
      return NextResponse.json(
        { error: 'Set VOICE_SUPERVISOR_PHONE or pass supervisorPhone' },
        { status: 400 },
      )
    }
    return NextResponse.json({ ok: true, transfer })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[sessions/transfer] POST', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Transfer failed' },
      { status: 500 },
    )
  }
}
