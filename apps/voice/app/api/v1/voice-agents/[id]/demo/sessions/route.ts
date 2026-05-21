/**
 * POST /api/v1/voice-agents/[id]/demo/sessions — start browser demo session
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { loadApprovedTrainingSnapshot, trainingPackVersionForAgent } from '@/lib/voice-agent/training-pack-load'

export const runtime = 'nodejs'

async function resolveAgentId(params: Promise<{ id: string }>) {
  return await params
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId } = await resolveAgentId(ctx.params)

    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId, status: 'active' },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const trainingVersion = await trainingPackVersionForAgent(agentId, tenantId)
    const approved = await loadApprovedTrainingSnapshot(agentId, tenantId)

    const session = await prisma.voiceDemoSession.create({
      data: {
        tenantId,
        voiceAgentId: agentId,
        trainingPackVersionAtStart: trainingVersion,
        channel: 'browser',
        status: 'active',
        transcriptJson: [],
        metadataJson: {
          hasApprovedTrainingAtStart: !!approved,
        },
      },
    })

    return NextResponse.json({
      sessionId: session.id,
      trainingPackVersionAtStart: trainingVersion,
    })
  } catch (error) {
    console.error('[demo/sessions] POST', error)
    return handleLicenseError(error)
  }
}
