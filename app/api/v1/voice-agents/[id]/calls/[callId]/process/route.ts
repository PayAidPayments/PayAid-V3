/**
 * Process Voice Call Audio
 * POST /api/v1/voice-agents/[id]/calls/[callId]/process
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { VoiceAgentOrchestrator } from '@/lib/voice-agent'
import { z } from 'zod'

const processCallSchema = z.object({
  audioData: z.string(), // Base64 encoded audio
  language: z.enum(['hi', 'en', 'ta', 'te', 'kn', 'mr', 'gu', 'pa', 'bn', 'ml']).optional(),
})

// POST /api/v1/voice-agents/[id]/calls/[callId]/process - Process audio chunk
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; callId: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify call exists and belongs to tenant
    const call = await prisma.voiceAgentCall.findFirst({
      where: {
        id: params.callId,
        agentId: params.id,
        tenantId: user.tenantId,
      },
      include: {
        agent: true,
      },
    })

    if (!call) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = processCallSchema.parse(body)

    // Process audio
    const orchestrator = new VoiceAgentOrchestrator()
    const audioBuffer = Buffer.from(validated.audioData, 'base64')
    
    const result = await orchestrator.processVoiceCall(
      params.id,
      audioBuffer,
      validated.language || call.agent.language
    )

    // Update call
    await prisma.voiceAgentCall.update({
      where: { id: params.callId },
      data: {
        status: call.status === 'queued' ? 'answered' : call.status,
        startTime: call.startTime || new Date(),
        transcript: result.transcript,
        languageUsed: result.detectedLanguage,
      },
    })

    // Update or create metadata
    if (call.metadata) {
      await prisma.voiceAgentCallMetadata.update({
        where: { callId: params.callId },
        data: {
          llmProvider: 'ollama',
        },
      })
    } else {
      await prisma.voiceAgentCallMetadata.create({
        data: {
          callId: params.callId,
          llmProvider: 'ollama',
        },
      })
    }

    return NextResponse.json({
      audio: result.audio.toString('base64'),
      transcript: result.transcript,
      response: result.response,
      detectedLanguage: result.detectedLanguage,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[VoiceAgentCall] Process error:', error)
    return NextResponse.json(
      { error: 'Failed to process call' },
      { status: 500 }
    )
  }
}

