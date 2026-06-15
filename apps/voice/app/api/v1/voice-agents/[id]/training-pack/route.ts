/**
 * GET/PATCH /api/v1/voice-agents/[id]/training-pack
 * Browser demo v1 — draft training JSON only (approve is separate route).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

import { parseTrainingPackDraft } from '@/lib/voice-agent/training-pack-validate'

export const runtime = 'nodejs'

async function resolveId(params: Promise<{ id: string }>) {
  return await params
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId } = await resolveId(ctx.params)

    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId },
      select: { id: true, publishedTrainingPackVersion: true },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    let pack = await prisma.voiceAgentTrainingPack.findUnique({
      where: { voiceAgentId: agentId },
    })
    if (pack && pack.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }
    if (!pack) {
      pack = await prisma.voiceAgentTrainingPack.create({
        data: {
          voiceAgentId: agentId,
          tenantId,
          draftJson: {},
          version: 0,
        },
      })
    }

    const lastPublish = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        entityType: 'VoiceAgent',
        entityId: agentId,
        changeSummary: { startsWith: 'Published training pack version' },
      },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    })

    return NextResponse.json({
      voiceAgentId: agentId,
      draftJson: pack.draftJson,
      approvedJson: pack.approvedJson,
      version: pack.version,
      submittedAt: pack.submittedAt,
      submittedByUserId: pack.submittedByUserId,
      approvedAt: pack.approvedAt,
      approvedByUserId: pack.approvedByUserId,
      publishedTrainingPackVersion: agent.publishedTrainingPackVersion,
      lastPublishedAt: lastPublish?.timestamp?.toISOString() ?? null,
    })
  } catch (error) {
    return handleLicenseError(error)
  }
}

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId } = await resolveId(ctx.params)

    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId },
      select: { id: true },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const existingPack = await prisma.voiceAgentTrainingPack.findUnique({
      where: { voiceAgentId: agentId },
      select: { tenantId: true },
    })
    if (existingPack && existingPack.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = (await request.json().catch(() => ({}))) as { draftJson?: unknown }
    if (body.draftJson === undefined) {
      return NextResponse.json({ error: 'draftJson is required' }, { status: 400 })
    }

    const draft = parseTrainingPackDraft(body.draftJson)

    const pack = await prisma.voiceAgentTrainingPack.upsert({
      where: { voiceAgentId: agentId },
      create: {
        voiceAgentId: agentId,
        tenantId,
        draftJson: draft as object,
        version: 0,
      },
      update: {
        draftJson: draft as object,
      },
    })

    return NextResponse.json({
      ok: true,
      draftJson: pack.draftJson,
      version: pack.version,
    })
  } catch (error) {
    return handleLicenseError(error)
  }
}
