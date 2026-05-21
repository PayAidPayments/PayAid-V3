/**
 * POST /api/v1/voice-agents/[id]/demo/sessions/[sessionId]/qa
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

export const runtime = 'nodejs'

const qaSchema = z.object({
  qaFlags: z
    .array(
      z.object({
        turnIndex: z.number().int().min(0),
        tags: z.array(z.string()),
        note: z.string().optional(),
      }),
    )
    .optional(),
  qaChecklist: z
    .array(
      z.object({
        intentId: z.string(),
        passed: z.boolean(),
        note: z.string().optional(),
      }),
    )
    .optional(),
})

async function resolveParams(
  params: Promise<{ id: string; sessionId: string }>,
) {
  return await params
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    const reviewerId = userId
    const { id: agentId, sessionId } = await resolveParams(ctx.params)

    const session = await prisma.voiceDemoSession.findFirst({
      where: { id: sessionId, voiceAgentId: agentId, tenantId },
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = qaSchema.parse(body)

    const flags =
      parsed.qaFlags?.map((f) => ({
        ...f,
        reviewerId,
        createdAt: new Date().toISOString(),
      })) ?? null

    const updated = await prisma.voiceDemoSession.update({
      where: { id: sessionId },
      data: {
        qaFlagsJson: flags ?? undefined,
        qaChecklistJson: parsed.qaChecklist ?? undefined,
        qaSubmittedAt: new Date(),
        qaSubmittedByUserId: reviewerId,
      },
    })

    return NextResponse.json({ ok: true, session: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[demo/qa] POST', error)
    return handleLicenseError(error)
  }
}
