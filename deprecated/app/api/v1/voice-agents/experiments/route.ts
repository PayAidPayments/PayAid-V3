/**
 * Voice Agent Experiments API
 * POST /api/v1/voice-agents/experiments - Create experiment
 * GET /api/v1/voice-agents/experiments - List experiments
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createExperimentSchema = z.object({
  agentId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  variants: z.array(z.object({
    id: z.string(),
    name: z.string(),
    config: z.record(z.any()),
    weight: z.number().min(0).max(100).optional(),
  })),
  trafficSplit: z.record(z.number().min(0).max(100)),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
})

// POST /api/v1/voice-agents/experiments - Create experiment
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createExperimentSchema.parse(body)

    // Verify agent belongs to tenant
    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: validated.agentId,
        tenantId: user.tenantId,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const experiment = await prisma.voiceAgentExperiment.create({
      data: {
        agentId: validated.agentId,
        tenantId: user.tenantId,
        name: validated.name,
        description: validated.description || null,
        variants: validated.variants,
        trafficSplit: validated.trafficSplit,
        status: 'active',
        startDate: validated.startDate ? new Date(validated.startDate) : new Date(),
        endDate: validated.endDate ? new Date(validated.endDate) : null,
      },
    })

    return NextResponse.json({ experiment }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[Experiments] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create experiment' },
      { status: 500 }
    )
  }
}

// GET /api/v1/voice-agents/experiments - List experiments
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const agentId = searchParams.get('agentId')
    const status = searchParams.get('status')

    const where: any = {
      tenantId: user.tenantId,
    }

    if (agentId) where.agentId = agentId
    if (status) where.status = status

    const experiments = await prisma.voiceAgentExperiment.findMany({
      where,
      include: {
        agent: true,
        _count: {
          select: {
            assignments: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ experiments })
  } catch (error) {
    console.error('[Experiments] List error:', error)
    return NextResponse.json(
      { error: 'Failed to list experiments' },
      { status: 500 }
    )
  }
}
