/**
 * Voice Agent Squads API
 * POST /api/v1/voice-agents/squads - Create squad
 * GET /api/v1/voice-agents/squads - List squads
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'
import { Prisma } from '@prisma/client'

const createSquadSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  routingRules: z.record(z.any()).optional().nullable(),
})

// POST /api/v1/voice-agents/squads - Create squad
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createSquadSchema.parse(body)

    const squad = await prisma.voiceAgentSquad.create({
      data: {
        tenantId: user.tenantId,
        name: validated.name,
        description: validated.description || null,
        routingRules: validated.routingRules ?? Prisma.JsonNull,
      },
      include: {
        members: {
          include: {
            agent: true,
          },
        },
      },
    })

    return NextResponse.json({ squad }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[Squads] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create squad' },
      { status: 500 }
    )
  }
}

// GET /api/v1/voice-agents/squads - List squads
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const squads = await prisma.voiceAgentSquad.findMany({
      where: { tenantId: user.tenantId },
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
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ squads })
  } catch (error) {
    console.error('[Squads] List error:', error)
    return NextResponse.json(
      { error: 'Failed to list squads' },
      { status: 500 }
    )
  }
}
