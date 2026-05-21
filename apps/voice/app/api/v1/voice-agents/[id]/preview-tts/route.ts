/**
 * POST /api/v1/voice-agents/[id]/preview-tts
 * Short TTS preview (not guaranteed to match Bolna/runtime phone TTS).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { generateTTS } from '@payaid/ai'
import { resolveGreeting } from '@/lib/voice-agent/runtime/bolna'
import type { VoiceAgentRow } from '@/lib/voice-agent/runtime/types'
import { z } from 'zod'

export const runtime = 'nodejs'

const bodySchema = z.object({
  text: z.string().optional(),
  useGreeting: z.boolean().optional(),
})

const MAX_PREVIEW_CHARS = 500

async function resolveId(params: Promise<{ id: string }>) {
  return await params
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { id: agentId } = await resolveId(ctx.params)

    const agent = await prisma.voiceAgent.findFirst({
      where: { id: agentId, tenantId, status: 'active' },
    })
    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = bodySchema.parse(body)

    const row: VoiceAgentRow = {
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      description: agent.description,
      language: agent.language,
      voiceId: agent.voiceId,
      voiceTone: agent.voiceTone,
      systemPrompt: agent.systemPrompt,
      phoneNumber: agent.phoneNumber,
      status: agent.status,
      knowledgeBase: agent.knowledgeBase,
      functions: agent.functions,
      workflow: agent.workflow,
      compliance: agent.compliance,
    }

    let text = parsed.text?.trim() ?? ''
    if (parsed.useGreeting) {
      text = resolveGreeting(row)
    }
    if (!text) {
      text = resolveGreeting(row).slice(0, MAX_PREVIEW_CHARS)
    }
    text = text.slice(0, MAX_PREVIEW_CHARS)

    const result = await generateTTS(text, agent.language || 'hi')
    if (result.audio) {
      return new NextResponse(new Uint8Array(result.audio), {
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'private, max-age=300',
        },
      })
    }
    return NextResponse.json({ text: result.text, fallback: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 })
    }
    console.error('[preview-tts]', error)
    return handleLicenseError(error)
  }
}
