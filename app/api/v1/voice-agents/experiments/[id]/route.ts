/**
 * Voice Agent Experiment API (Single)
 * GET /api/v1/voice-agents/experiments/[id] - Get experiment
 * PUT /api/v1/voice-agents/experiments/[id] - Update experiment
 * DELETE /api/v1/voice-agents/experiments/[id] - Delete experiment
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateExperimentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  variants: z.array(z.any()).optional(),
  trafficSplit: z.record(z.number()).optional(),
  status: z.enum(['active', 'paused', 'completed']).optional(),
  endDate: z.string().datetime().optional().nullable(),
})

// GET /api/v1/voice-agents/experiments/[id] - Get experiment
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const experiment = await prisma.voiceAgentExperiment.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      include: {
        agent: true,
        assignments: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            assignments: true,
          },
        },
      },
    })

    if (!experiment) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    return NextResponse.json(experiment)
  } catch (error) {
    console.error('[Experiments] Get error:', error)
    return NextResponse.json(
      { error: 'Failed to get experiment' },
      { status: 500 }
    )
  }
}

// PUT /api/v1/voice-agents/experiments/[id] - Update experiment
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
    const validated = updateExperimentSchema.parse(body)

    const experiment = await prisma.voiceAgentExperiment.updateMany({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
      data: {
        ...(validated.name && { name: validated.name }),
        ...(validated.description !== undefined && { description: validated.description }),
        ...(validated.variants && { variants: validated.variants }),
        ...(validated.trafficSplit && { trafficSplit: validated.trafficSplit }),
        ...(validated.status && { status: validated.status }),
        ...(validated.endDate !== undefined && { endDate: validated.endDate ? new Date(validated.endDate) : null }),
      },
    })

    if (experiment.count === 0) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    const updated = await prisma.voiceAgentExperiment.findUnique({
      where: { id: params.id },
      include: {
        agent: true,
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

    console.error('[Experiments] Update error:', error)
    return NextResponse.json(
      { error: 'Failed to update experiment' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/voice-agents/experiments/[id] - Delete experiment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user || !user.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const experiment = await prisma.voiceAgentExperiment.deleteMany({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (experiment.count === 0) {
      return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Experiments] Delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete experiment' },
      { status: 500 }
    )
  }
}
