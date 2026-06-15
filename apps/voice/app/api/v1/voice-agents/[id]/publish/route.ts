/**
 * POST /api/v1/voice-agents/[id]/publish
 * Sets publishedTrainingPackVersion, syncs Bolna when voiceRuntime === 'bolna', audit log.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { canApproveVoiceAgentTraining } from '@/lib/voice-agent/training-pack-validate'
import { isBolnaRuntimeEnabled, syncBolnaAgent } from '@/lib/voice-agent/runtime/bolna'
import { loadApprovedTrainingSnapshot } from '@/lib/voice-agent/training-pack-load'

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
      return NextResponse.json({ error: 'Publish requires admin role' }, { status: 403 })
    }

    const { id: agentId } = await resolveAgentId(ctx.params)
    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId, status: { not: 'deleted' } },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const pack = await prisma.voiceAgentTrainingPack.findUnique({
      where: { voiceAgentId: agentId },
    })
    if (!pack?.approvedJson || pack.version < 1) {
      return NextResponse.json(
        { error: 'Approve a training pack before publish' },
        { status: 400 },
      )
    }
    if (pack.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const trainingPackApproved = await loadApprovedTrainingSnapshot(agentId, tenantId)

    await prisma.voiceAgent.update({
      where: { id: agentId },
      data: { publishedTrainingPackVersion: pack.version },
    })

    let bolnaSync: { bolnaAgentId?: string; syncedAt?: string } | null = null
    if (agent.voiceRuntime === 'bolna' && isBolnaRuntimeEnabled()) {
      try {
        const synced = await syncBolnaAgent({
          id: agent.id,
          tenantId: agent.tenantId,
          name: agent.name,
          description: agent.description,
          language: agent.language,
          voiceId: agent.voiceId,
          voiceTone: agent.voiceTone,
          systemPrompt: agent.systemPrompt,
          phoneNumber: agent.phoneNumber,
          status: agent.status,
          knowledgeBase: agent.knowledgeBase,
          functions: agent.functions,
          workflow: agent.workflow,
          compliance: agent.compliance,
          voiceRuntime: agent.voiceRuntime,
          bolnaAgentId: agent.bolnaAgentId,
          runtimeSyncedAt: agent.runtimeSyncedAt,
          trainingPackApproved,
        })
        await prisma.voiceAgent.update({
          where: { id: agent.id },
          data: { bolnaAgentId: synced.bolnaAgentId, runtimeSyncedAt: synced.syncedAt },
        })
        bolnaSync = { bolnaAgentId: synced.bolnaAgentId, syncedAt: synced.syncedAt.toISOString() }
      } catch (e) {
        console.error('[publish] Bolna sync failed:', e)
        return NextResponse.json(
          {
            error: 'Published version saved but Bolna sync failed',
            detail: e instanceof Error ? e.message : String(e),
            publishedTrainingPackVersion: pack.version,
          },
          { status: 502 },
        )
      }
    }

    await prisma.auditLog.create({
      data: {
        entityType: 'VoiceAgent',
        entityId: agentId,
        changedBy: userId,
        changeSummary: `Published training pack version ${pack.version}`,
        tenantId,
        beforeSnapshot: { publishedTrainingPackVersion: agent.publishedTrainingPackVersion },
        afterSnapshot: { publishedTrainingPackVersion: pack.version, bolnaSync },
      },
    })

    return NextResponse.json({
      ok: true,
      publishedTrainingPackVersion: pack.version,
      bolnaSync,
    })
  } catch (error) {
    return handleLicenseError(error)
  }
}
