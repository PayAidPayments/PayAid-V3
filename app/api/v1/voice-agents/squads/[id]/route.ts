/**
 * Voice Agent Squad API (Single)
 * GET /api/v1/voice-agents/squads/[id] - Get squad
 * PUT /api/v1/voice-agents/squads/[id] - Update squad
 * DELETE /api/v1/voice-agents/squads/[id] - Delete squad
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { getSquadRouter } from '@/lib/voice-agent/squad-router'

const updateSquadSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  routingRules: z.record(z.any()).optional().nullable(),
})

// GET /api/v1/voice-agents/squads/[id] - Get squad
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
      include: {
        members: {
          include: {
            agent: true,
          },
          orderBy: {
            priority: 'desc',
          },
        },
      },
    })

    if (!squad) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    return NextResponse.json(squad)
  } catch (error) {
    console.error('[Squads] Get error:', error)
    return NextResponse.json(
      { error: 'Failed to get squad' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/voice-agents/squads/[id] - Update squad
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateSquadSchema.parse(body)

    const squad = await prisma.voiceAgentSquad.updateMany({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.routingRules !== undefined && { routingRules: validated.routingRules }),
      },
    })

    if (squad.count === 0) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    const updated = await prisma.voiceAgentSquad.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            agent: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[Squads] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update squad' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/voice-agents/squads/[id] - Delete squad
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const squad = await prisma.voiceAgentSquad.deleteMany({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (squad.count === 0) {
      return NextResponse.json({ error: 'Squad not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Squads] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete squad' },
      { status: 500 }
    )
  }
}
