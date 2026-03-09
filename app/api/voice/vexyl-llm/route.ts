/**
 * VEXYL Custom LLM Webhook
 * PayAid acts as the LLM for VEXYL Voice Gateway (Standard mode).
 * VEXYL sends: { message, sessionId, context: { callerName, phone, agentId?, botId?, ... } }
 * We return: { response, metadata: { shouldHangup?: boolean } }
 * @see https://vexyl.ai/docs/llm.html
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { VoiceAgentOrchestrator } from '@/lib/voice-agent/orchestrator'

const MAX_SESSION_HISTORY = 10
const sessionHistory = new Map<string, Array<{ role: 'user' | 'assistant'; content: string }>>()

function getOrCreateHistory(sessionId: string): Array<{ role: 'user' | 'assistant'; content: string }> {
  let h = sessionHistory.get(sessionId)
  if (!h) {
    h = []
    sessionHistory.set(sessionId, h)
  }
  return h
}

function appendAndTrim(
  sessionId: string,
  userContent: string,
  assistantContent: string
): Array<{ role: 'user' | 'assistant'; content: string }> {
  const h = getOrCreateHistory(sessionId)
  h.push({ role: 'user', content: userContent })
  h.push({ role: 'assistant', content: assistantContent })
  while (h.length > MAX_SESSION_HISTORY) h.shift()
  return h
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : ''
    const context = body?.context && typeof body.context === 'object' ? body.context : {}

    if (!message) {
      return NextResponse.json(
        { response: 'I didn’t catch that. Could you repeat?', metadata: { shouldHangup: false } },
        { status: 200 }
      )
    }

    const agentId = context.agentId || context.botId || context.voice_agent_id
    if (!agentId) {
      return NextResponse.json(
        {
          response: 'This line is not configured for voice assistant. Please contact support.',
          metadata: { shouldHangup: true },
        },
        { status: 200 }
      )
    }

    const agent = await prisma.voiceAgent.findUnique({
      where: { id: agentId },
      select: { id: true, status: true },
    })
    if (!agent || agent.status !== 'active') {
      return NextResponse.json(
        {
          response: 'This assistant is currently unavailable. Goodbye.',
          metadata: { shouldHangup: true },
        },
        { status: 200 }
      )
    }

    const history = getOrCreateHistory(sessionId)
    const callerContext = [
      context.callerName && `Caller name: ${context.callerName}`,
      context.phone && `Phone: ${context.phone}`,
      context.llm_context && `Context: ${context.llm_context}`,
    ]
      .filter(Boolean)
      .join('. ')

    const orchestrator = new VoiceAgentOrchestrator(prisma)
    const responseText = await orchestrator.processTextTurn(agentId, message, history, {
      language: context.language || undefined,
      callerContext: callerContext || undefined,
    })

    appendAndTrim(sessionId, message, responseText)

    return NextResponse.json({
      response: responseText,
      metadata: { shouldHangup: false },
    })
  } catch (error) {
    console.error('[VEXYL LLM]', error)
    return NextResponse.json(
      {
        response: 'Sorry, I’m having a temporary issue. Please try again in a moment.',
        metadata: { shouldHangup: false },
      },
      { status: 200 }
    )
  }
}
