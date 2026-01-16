/**
 * Voice Agent Demo API
 * POST /api/v1/voice-agents/[id]/demo - Test agent with text input (for demos)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { generateVoiceResponse } from '@/lib/voice-agent/llm'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { z } from 'zod'

const demoMessageSchema = z.object({
  message: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
})

// POST /api/v1/voice-agents/[id]/demo - Test agent with text
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
    const validated = demoMessageSchema.parse(body)

    // Search Knowledge Base (if enabled)
    let context = ''
    try {
      const kbResults = await searchKnowledgeBase(params.id, validated.message, 3)
      if (kbResults && kbResults.length > 0) {
        context = kbResults
          .map((r) => r.content)
          .join('\n\n')
      }
    } catch (error) {
      console.warn('[VoiceAgentDemo] Knowledge base search failed:', error)
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(agent, agent.language, context)

    // Prepare conversation history (without the current user message - LLM will add it)
    const conversationHistory = validated.conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    // Add current user message to history for LLM
    conversationHistory.push({
      role: 'user',
      content: validated.message,
    })

    // Generate response using LLM
    const response = await generateVoiceResponse(
      systemPrompt,
      conversationHistory,
      agent.language
    )

    return NextResponse.json({
      agentId: params.id,
      agentName: agent.name,
      userMessage: validated.message,
      agentResponse: response,
      language: agent.language,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[VoiceAgentDemo] Error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process demo message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function buildSystemPrompt(
  agent: { systemPrompt: string; language: string; voiceTone?: string | null },
  language: string,
  context: string
): string {
  let prompt = agent.systemPrompt

  // Add language instruction
  const languageNames: Record<string, string> = {
    hi: 'Hindi',
    en: 'English',
    ta: 'Tamil',
    te: 'Telugu',
    kn: 'Kannada',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
    bn: 'Bengali',
    ml: 'Malayalam',
  }

  const langName = languageNames[language] || 'English'
  prompt += `\n\nYou are speaking in ${langName}. Respond naturally in ${langName}.`

  // Add voice tone if specified
  if (agent.voiceTone) {
    prompt += `\n\nTone: ${agent.voiceTone}`
  }

  // Add context from knowledge base
  if (context) {
    prompt += `\n\nRelevant context:\n${context}`
  }

  // Add conversation guidelines
  prompt += `\n\nKeep responses concise and natural, suitable for voice conversation.`

  return prompt
}

