/**
 * GET /api/v1/voice-agents/[id]/demo/sessions/[sessionId]/transcript
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { parseTranscriptJson } from '@/lib/voice-agent/demo-transcript'

export const runtime = 'nodejs'

async function resolveParams(
  params: Promise<{ id: string; sessionId: string }>,
) {
  return await params
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId, sessionId } = await resolveParams(ctx.params)

    const session = await prisma.voiceDemoSession.findFirst({
      where: { id: sessionId, voiceAgentId: agentId, tenantId },
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json({
      transcript: parseTranscriptJson(session.transcriptJson),
      status: session.status,
      outcomeCode: session.outcomeCode,
    })
  } catch (error) {
    console.error('[demo/transcript] GET', error)
    return handleLicenseError(error)
  }
}
