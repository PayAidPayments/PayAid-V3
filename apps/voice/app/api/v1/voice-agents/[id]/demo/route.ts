/**
 * Voice Agent Demo API
 * POST /api/v1/voice-agents/[id]/demo - Test agent with text input (for demos)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { generateVoiceResponse } from '@/lib/voice-agent/llm'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { buildMergedSystemContext } from '@/lib/voice-agent/agent-runtime-context'
import { loadApprovedTrainingSnapshot } from '@/lib/voice-agent/training-pack-load'
import { z } from 'zod'

const demoMessageSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId } = await params

    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: agentId,
        tenantId,
        status: 'active',
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = demoMessageSchema.parse(body)

    let context = ''
    try {
      const kbResults = await searchKnowledgeBase(agentId, validated.message, 3)
      if (kbResults && kbResults.length > 0) {
        context = kbResults.map((r) => r.content).join('\n\n')
      }
    } catch (error) {
      console.warn('[VoiceAgentDemo] Knowledge base search failed:', error)
    }

    const approved = await loadApprovedTrainingSnapshot(agentId, tenantId)
    const systemPrompt = buildMergedSystemContext(
      {
        id: agent.id,
        tenantId: agent.tenantId,
        name: agent.name,
        description: agent.description,
        language: agent.language,
        voiceTone: agent.voiceTone,
        systemPrompt: agent.systemPrompt,
        workflow: agent.workflow,
        knowledgeBase: agent.knowledgeBase,
        functions: agent.functions,
        compliance: agent.compliance,
      },
      { kbContext: context, trainingPackApproved: approved },
    )

    const conversationHistory = validated.conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    conversationHistory.push({
      role: 'user',
      content: validated.message,
    })

    const response = await generateVoiceResponse(systemPrompt, conversationHistory, agent.language)

    return NextResponse.json({
      agentId,
      agentName: agent.name,
      userMessage: validated.message,
      agentResponse: response,
      language: agent.language,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }

    console.error('[VoiceAgentDemo] Error:', error)
    return handleLicenseError(error)
  }
}
