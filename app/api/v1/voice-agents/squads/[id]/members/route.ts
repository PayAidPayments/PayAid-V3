/**
 * Voice Agent Squad Members API
 * POST /api/v1/voice-agents/squads/[id]/members - Add member
 * GET /api/v1/voice-agents/squads/[id]/members - List members
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const addMemberSchema = z.object({
  agentId: z.string().min(1),
  priority: z.number().int().min(0).default(0),
  conditions: z.record(z.any()).optional().nullable(),
})

// POST /api/v1/voice-agents/squads/[id]/members - Add member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify squad belongs to tenant
    const squad = await prisma.voiceAgentSquad.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    // Verify agent belongs to tenant
    const body = await request.json()
    const validated = addMemberSchema.parse(body)

    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: validated.agentId,
        tenantId: user.tenantId,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const member = await prisma.voiceAgentSquadMember.create({
      data: {
        squadId: params.id,
        agentId: validated.agentId,
        priority: validated.priority,
        conditions: validated.conditions ?? Prisma.JsonNull,
      },
      include: {
        agent: true,
      },
    })

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[Squads] Add member error:', error)
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    )
  }
}

// GET /api/v1/voice-agents/squads/[id]/members - List members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const squad = await prisma.voiceAgentSquad.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    const members = await prisma.voiceAgentSquadMember.findMany({
      where: { squadId: params.id },
      include: {
        agent: true,
      },
      orderBy: {
        priority: 'desc',
      },
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('[Squads] List members error:', error)
    return NextResponse.json(
      { error: 'Failed to list members' },
      { status: 500 }
    )
  }
}
