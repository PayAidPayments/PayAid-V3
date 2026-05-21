/**
 * PATCH /api/v1/voice-agents/[id]/demo/sessions/[sessionId]
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

export const runtime = 'nodejs'

async function resolveParams(params: Promise<{ id: string; sessionId: string }>) {
  return await params
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId, sessionId } = await resolveParams(ctx.params)

    const body = (await request.json().catch(() => ({}))) as {
      status?: string
      outcomeCode?: string | null
    }

    const session = await prisma.voiceDemoSession.findFirst({
      where: { id: sessionId, voiceAgentId: agentId, tenantId },
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const data: { status?: string; endedAt?: Date; outcomeCode?: string | null } = {}
    if (body.status === 'ended') {
      data.status = 'ended'
      data.endedAt = new Date()
    }
    if (body.outcomeCode !== undefined) {
      data.outcomeCode = body.outcomeCode
    }

    const updated = await prisma.voiceDemoSession.update({
      where: { id: sessionId },
      data,
    })

    return NextResponse.json({ ok: true, session: updated })
  } catch (error) {
    console.error('[demo/session] PATCH', error)
    return handleLicenseError(error)
  }
}
