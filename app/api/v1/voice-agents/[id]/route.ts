/**
 * Voice Agent API (Single)
 * GET /api/v1/voice-agents/[id] - Get agent
 * PUT /api/v1/voice-agents/[id] - Update agent
 * DELETE /api/v1/voice-agents/[id] - Delete agent
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateAgentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  language: z.enum(['hi', 'en', 'ta', 'te', 'kn', 'mr', 'gu', 'pa', 'bn', 'ml']).optional(),
  voiceId: z.string().optional(),
  voiceTone: z.string().optional(),
  systemPrompt: z.string().min(1).optional(),
  phoneNumber: z.string().optional(),
  status: z.enum(['active', 'paused', 'deleted']).optional(),
})

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

    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: user.tenantId,
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

    const agent = await prisma.voiceAgent.update({
      where: { id: resolvedParams.id },
      data: validated,
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

