/**
 * POST /api/v1/voice-agents/[id]/training-pack/approve
 * Copies validated draft → approvedJson, increments version (immutable snapshot).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { canApproveVoiceAgentTraining, parseTrainingPackDraft } from '@/lib/voice-agent/training-pack-validate'

export const runtime = 'nodejs'

async function resolveAgentId(params: Promise<{ id: string }>) {
  return await params
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'ai-studio')
    if (!canApproveVoiceAgentTraining(roles)) {
      return NextResponse.json({ error: 'Approve requires admin role' }, { status: 403 })
    }

    const { id: agentId } = await resolveAgentId(ctx.params)
    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId },
      select: { id: true },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const pack = await prisma.voiceAgentTrainingPack.findUnique({
      where: { voiceAgentId: agentId },
    })
    if (!pack) {
      return NextResponse.json({ error: 'Training pack not found' }, { status: 404 })
    }
    if (pack.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const snapshot = parseTrainingPackDraft(pack.draftJson)
    const nextVersion = pack.version + 1

    const updated = await prisma.voiceAgentTrainingPack.update({
      where: { voiceAgentId: agentId },
      data: {
        approvedJson: snapshot as object,
        version: nextVersion,
        approvedAt: new Date(),
        approvedByUserId: userId,
      },
    })

    return NextResponse.json({
      ok: true,
      version: updated.version,
      approvedAt: updated.approvedAt,
    })
  } catch (error) {
    return handleLicenseError(error)
  }
}
