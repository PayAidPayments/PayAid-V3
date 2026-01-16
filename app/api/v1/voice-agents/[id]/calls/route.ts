/**
 * Voice Agent Calls API
 * POST /api/v1/voice-agents/[id]/calls - Initiate call
 * GET /api/v1/voice-agents/[id]/calls - List calls
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { VoiceAgentOrchestrator } from '@/lib/voice-agent'
import { z } from 'zod'

const createCallSchema = z.object({
  phone: z.string().min(10).max(20),
  customerName: z.string().optional(),
  customerId: z.string().optional(),
  language: z.enum(['hi', 'en', 'ta', 'te', 'kn', 'mr', 'gu', 'pa', 'bn', 'ml']).optional(),
  audioData: z.string().optional(), // Base64 encoded audio for immediate processing
})

// POST /api/v1/voice-agents/[id]/calls - Initiate call
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify agent exists and belongs to tenant
    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
        status: 'active',
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createCallSchema.parse(body)

    // Create call record
    const call = await prisma.voiceAgentCall.create({
      data: {
        agentId: params.id,
        tenantId: user.tenantId,
        phone: validated.phone,
        customerName: validated.customerName,
        customerId: validated.customerId,
        status: 'queued',
        languageUsed: validated.language || agent.language,
        dndChecked: false, // TODO: Implement DND checking
      },
    })

    // If audio data provided, process immediately
    if (validated.audioData) {
      try {
        const orchestrator = new VoiceAgentOrchestrator()
        const audioBuffer = Buffer.from(validated.audioData, 'base64')
        
        const result = await orchestrator.processVoiceCall(
          params.id,
          audioBuffer,
          validated.language || agent.language
        )

        // Update call with results
        await prisma.voiceAgentCall.update({
          where: { id: call.id },
          data: {
            status: 'answered',
            startTime: new Date(),
            transcript: result.transcript,
            languageUsed: result.detectedLanguage,
          },
        })

        // Create metadata
        await prisma.voiceAgentCallMetadata.create({
          data: {
            callId: call.id,
            llmProvider: 'ollama',
          },
        })

        return NextResponse.json({
          callId: call.id,
          status: 'answered',
          audio: result.audio.toString('base64'),
          transcript: result.transcript,
          response: result.response,
          detectedLanguage: result.detectedLanguage,
        })
      } catch (error) {
        console.error('[VoiceAgentCall] Processing error:', error)
        // Update call status to failed
        await prisma.voiceAgentCall.update({
          where: { id: call.id },
          data: { status: 'failed' },
        })
        throw error
      }
    }

    // Return call queued status
    return NextResponse.json({
      callId: call.id,
      status: 'queued',
      message: 'Call queued. Process audio chunks via /api/v1/voice-agents/[id]/calls/[callId]/process',
    }, { status: 202 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[VoiceAgentCall] Create error:', error)
    return NextResponse.json(
      { error: 'Failed to create call' },
      { status: 500 }
    )
  }
}

// GET /api/v1/voice-agents/[id]/calls - List calls
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    const where: any = {
      agentId: params.id,
      tenantId: user.tenantId,
    }

    if (status) where.status = status

    const [calls, total] = await Promise.all([
      prisma.voiceAgentCall.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          metadata: true,
        },
      }),
      prisma.voiceAgentCall.count({ where }),
    ])

    return NextResponse.json({
      calls,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[VoiceAgentCall] List error:', error)
    return NextResponse.json(
      { error: 'Failed to list calls' },
      { status: 500 }
    )
  }
}

