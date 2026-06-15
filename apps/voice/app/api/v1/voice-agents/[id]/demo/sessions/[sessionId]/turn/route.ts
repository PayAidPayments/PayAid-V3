/**
 * POST /api/v1/voice-agents/[id]/demo/sessions/[sessionId]/turn
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { generateVoiceResponse } from '@/lib/voice-agent/llm'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { buildMergedSystemContext } from '@/lib/voice-agent/agent-runtime-context'
import { loadApprovedTrainingSnapshot } from '@/lib/voice-agent/training-pack-load'
import { parseTranscriptJson, type DemoTranscriptTurn } from '@/lib/voice-agent/demo-transcript'
import {
  maxTokensForVerbosity,
  parseVoiceBehaviorFromWorkflow,
} from '@/lib/voice-agent/voice-behavior-config'
import { z } from 'zod'

export const runtime = 'nodejs'

const turnSchema = z.object({
  message: z.string().min(1),
})

async function resolveParams(
  params: Promise<{ id: string; sessionId: string }>,
) {
  return await params
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string; sessionId: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId, sessionId } = await resolveParams(ctx.params)

    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId, status: 'active' },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const session = await prisma.voiceDemoSession.findFirst({
      where: { id: sessionId, voiceAgentId: agentId, tenantId, status: 'active' },
    })
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const body = await request.json()
    const { message } = turnSchema.parse(body)

    let context = ''
    try {
      const kbResults = await searchKnowledgeBase(agentId, message, 3)
      if (kbResults?.length) {
        context = kbResults.map((r) => r.content).join('\n\n')
      }
    } catch {
      /* ignore */
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

    const transcript = parseTranscriptJson(session.transcriptJson)
    const history: { role: 'user' | 'assistant'; content: string }[] = transcript.map((t) => ({
      role: t.role,
      content: t.content,
    }))
    history.push({ role: 'user', content: message })

    const voiceBehavior = parseVoiceBehaviorFromWorkflow(agent.workflow)
    const response = await generateVoiceResponse(systemPrompt, history, agent.language, {
      maxTokens: maxTokensForVerbosity(voiceBehavior.verbosityPreset),
    })

    const now = new Date().toISOString()
    const nextTranscript: DemoTranscriptTurn[] = [
      ...transcript,
      { role: 'user', content: message, timestamp: now },
      { role: 'assistant', content: response, timestamp: now },
    ]

    await prisma.voiceDemoSession.update({
      where: { id: sessionId },
      data: { transcriptJson: nextTranscript as unknown as object[] },
    })

    return NextResponse.json({
      agentResponse: response,
      transcript: nextTranscript,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('[demo/turn] POST', error)
    return handleLicenseError(error)
  }
}
