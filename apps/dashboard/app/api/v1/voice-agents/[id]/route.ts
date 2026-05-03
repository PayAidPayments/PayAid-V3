/**
 * Voice Agent API — single agent (dashboard app)
 * Mirrors apps/voice/app/api/v1/voice-agents/[id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  language: z.string().min(2).max(10).optional(),
  voiceId: z.string().optional(),
  voiceTone: z.string().optional(),
  systemPrompt: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  status: z.enum(['active', 'paused', 'deleted']).optional(),
  workflow: z.record(z.unknown()).optional().nullable(),
})

function getEffectiveTenantId(
  user: { tenantId?: string; tenant_id?: string; sub?: string },
  queryTenantId: string | null
): string | null {
  const jwtTenantId = user.tenantId ?? user.tenant_id ?? ''
  if (!queryTenantId) return jwtTenantId || null
  if (queryTenantId === jwtTenantId) return queryTenantId
  return null
}

async function userHasAccessToTenant(userId: string, tenantId: string): Promise<boolean> {
  const member = await prisma.tenantMember.findFirst({
    where: { userId, tenantId },
  })
  return !!member
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params
    const queryTenantId = request.nextUrl.searchParams.get('tenantId')

    if (queryTenantId && resolvedParams.id) {
      try {
        const demoAgent = await prisma.voiceAgent.findFirst({
          where: {
            id: resolvedParams.id,
            tenantId: queryTenantId,
            status: { not: 'deleted' },
          },
          include: {
            _count: { select: { calls: true } },
          },
        })
        if (demoAgent) {
          return NextResponse.json(demoAgent)
        }
        return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
      } catch (dbError) {
        console.error('[VoiceAgents] Get agent (demo) DB error:', dbError)
        return NextResponse.json(
          { error: 'Service temporarily unavailable. Please try again.' },
          { status: 503 }
        )
      }
    }

    let effectiveTenantId: string | null = getEffectiveTenantId(user, queryTenantId)
    if (queryTenantId && !effectiveTenantId) {
      const userId = user.sub ?? (user as { userId?: string }).userId ?? ''
      if (userId && (await userHasAccessToTenant(userId, queryTenantId))) {
        effectiveTenantId = queryTenantId
      }
    }
    if (!effectiveTenantId) {
      effectiveTenantId = user.tenantId ?? (user as { tenant_id?: string }).tenant_id ?? null
    }

    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: effectiveTenantId,
      },
      include: {
        _count: {
          select: {
            calls: true,
          },
        },
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    return NextResponse.json(agent)
  } catch (error) {
    console.error('[VoiceAgents] Get error:', error)
    return NextResponse.json({ error: 'Failed to get agent' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params

    const body = await request.json()
    const validated = updateAgentSchema.parse(body)

    const existing = await prisma.voiceAgent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = { ...validated }
    if ('workflow' in validated && validated.workflow !== undefined) {
      updateData.workflow = validated.workflow
    }
    const agent = await prisma.voiceAgent.update({
      where: { id: resolvedParams.id },
      data: updateData as Parameters<typeof prisma.voiceAgent.update>[0]['data'],
    })

    return NextResponse.json(agent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    console.error('[VoiceAgents] Update error:', error)
    return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await params

    const existing = await prisma.voiceAgent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    await prisma.voiceAgent.update({
      where: { id: resolvedParams.id },
      data: { status: 'deleted' },
    })

    return NextResponse.json({ status: 'deleted' })
  } catch (error) {
    console.error('[VoiceAgents] Delete error:', error)
    return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
  }
}
