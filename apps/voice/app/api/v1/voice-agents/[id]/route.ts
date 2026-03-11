/**
 * Voice Agent API (Single)
 * GET /api/v1/voice-agents/[id] - Get agent
 * PUT /api/v1/voice-agents/[id] - Update agent
 * DELETE /api/v1/voice-agents/[id] - Delete agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
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
  workflow: z.record(z.unknown()).optional().nullable(), // legacy nodes/edges or 3-tab: purpose, greeting, script, objections, crm
})

// Resolve effective tenant: JWT may use tenantId or tenant_id; optional query tenantId if user has access
function getEffectiveTenantId(user: { tenantId?: string; tenant_id?: string; sub?: string }, queryTenantId: string | null): string | null {
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

// GET /api/v1/voice-agents/[id] - Get agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle Next.js 15 async params
    const resolvedParams = params instanceof Promise ? await params : params
    const queryTenantId = request.nextUrl.searchParams.get('tenantId')

    // Demo links: when tenantId is in the URL, allow any authenticated user to load that agent (shared demo)
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
        // Agent not found for this demo link – return 404 so client shows "Agent not found" not generic error
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
      const userId = user.sub ?? (user as any).userId ?? ''
      if (userId && (await userHasAccessToTenant(userId, queryTenantId))) {
        effectiveTenantId = queryTenantId
      }
    }
    if (!effectiveTenantId) {
      effectiveTenantId = user.tenantId ?? (user as any).tenant_id ?? null
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
    return NextResponse.json(
      { error: 'Failed to get agent' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/voice-agents/[id] - Update agent
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle Next.js 15 async params
    const resolvedParams = params instanceof Promise ? await params : params

    const body = await request.json()
    const validated = updateAgentSchema.parse(body)

    // Check agent exists and belongs to tenant
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
      data: updateData as any,
    })

    return NextResponse.json(agent)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[VoiceAgents] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update agent' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/voice-agents/[id] - Delete agent (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle Next.js 15 async params
    const resolvedParams = params instanceof Promise ? await params : params

    // Check agent exists and belongs to tenant
    const existing = await prisma.voiceAgent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: user.tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    // Soft delete
    await prisma.voiceAgent.update({
      where: { id: resolvedParams.id },
      data: { status: 'deleted' },
    })

    return NextResponse.json({ status: 'deleted' })
  } catch (error) {
    console.error('[VoiceAgents] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete agent' },
      { status: 500 }
    )
  }
}

