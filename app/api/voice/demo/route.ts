/**
 * POST /api/voice/demo
 * WebRTC-style demo: transcript + agentId → LLM → VEXYL TTS → return audio.
 * Used by the Demo page "Speak" flow (Web Speech API STT → this → play audio).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { generateVoiceResponse } from '@/lib/voice-agent/llm'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'
import { z } from 'zod'

const bodySchema = z.object({
  agentId: z.string().min(1),
  transcript: z.string().min(1).max(2000),
  tenantId: z.string().min(1).optional(), // from demo page URL; allows shared demo links
  conversationHistory: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .optional()
    .default([]),
})

const OBJECTION_HANDLING = `
MUST handle objections professionally:
- "No money" / "Paise nahi hai": Offer EMI or payment plan. "Samajhta hun. Kya EMI option dekhna chahenge?"
- "Wrong number" / "Galat number": Apologise and end. "Maaf kijiye galti se call aayi. Aapka number save nahi karenge."
- "Talk to boss" / "Boss se baat karo": Take callback. "Theek hai ji. Callback number de dijiye?"
ALWAYS: Polite, professional; confirm understanding ("Samajh gaya..."); end positively ("Dhanyavaad, aapka din accha ho!").
`

function buildSystemPrompt(
  agent: { systemPrompt: string; language: string; voiceTone?: string | null },
  language: string,
  context: string
): string {
  let prompt = agent.systemPrompt
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
  languageNames['hi-IN'] = 'Hindi'
  languageNames['en-IN'] = 'English'
  const langName = languageNames[language] || language || 'English'
  prompt += `\n\nYou are speaking in ${langName}. Respond naturally in ${langName}.`
  prompt += OBJECTION_HANDLING
  if (agent.voiceTone) prompt += `\n\nTone: ${agent.voiceTone}`
  if (context) prompt += `\n\nRelevant context:\n${context}`
  prompt += `\n\nKeep responses concise and natural, suitable for voice conversation.`
  return prompt
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { agentId, transcript, tenantId: bodyTenantId, conversationHistory } = parsed.data

    // Demo links: when tenantId is sent (from page URL), allow any authenticated user to use that agent
    const agent = bodyTenantId
      ? await prisma.voiceAgent.findFirst({
          where: {
            id: agentId,
            tenantId: bodyTenantId,
            status: { not: 'deleted' },
          },
        })
      : await prisma.voiceAgent.findFirst({
          where: {
            id: agentId,
            tenantId: user.tenantId ?? (user as { tenant_id?: string }).tenant_id,
            status: 'active',
          },
        })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    let context = ''
    try {
      const kbResults = await searchKnowledgeBase(agentId, transcript, 3)
      if (kbResults?.length) {
        context = kbResults.map((r) => r.content).join('\n\n')
      }
    } catch {
      // ignore
    }

    const systemPrompt = buildSystemPrompt(agent, agent.language, context)
    // Cap to last 5 exchanges (10 messages) to avoid token overflow and memory issues
    const maxHistory = 10
    const recentHistory = conversationHistory.slice(-maxHistory)
    const history = [...recentHistory, { role: 'user' as const, content: transcript }]
    const responseText = await generateVoiceResponse(
      systemPrompt,
      history,
      agent.language
    )

    const voiceStyle = agent.voiceTone
      ? { voiceTone: agent.voiceTone }
      : undefined
    const authHeader = request.headers.get('authorization')
    const gatewayToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader ?? undefined
    let audio: Buffer | null = null
    let ttsError: string | null = null
    try {
      audio = await synthesizeSpeech(
        responseText,
        agent.language,
        agent.voiceId ?? undefined,
        1.0,
        { ...voiceStyle, gatewayToken }
      )
    } catch (ttsErr) {
      const msg = ttsErr instanceof Error ? ttsErr.message : String(ttsErr)
      console.error('[Voice Demo] TTS failed:', msg)
      ttsError = msg
      // Never fail the request: return text only, no audio
    }

    // Optional: log demo usage (non-PII)
    try {
      await prisma.voiceAgentCall.create({
        data: {
          agentId: agent.id,
          tenantId: agent.tenantId,
          callSid: `demo-${Date.now()}`,
          from: 'demo',
          to: 'demo',
          phone: 'demo',
          inbound: false,
          status: 'completed',
          startTime: new Date(),
          endTime: new Date(),
        },
      })
    } catch {
      // ignore log failure
    }

    const accept = request.headers.get('accept') || ''
    if (accept.includes('application/json')) {
      return NextResponse.json({
        text: responseText,
        audio: audio ? Buffer.from(audio).toString('base64') : null,
        ...(ttsError && { ttsError }),
      })
    }
    if (audio) {
      return new NextResponse(audio, {
        status: 200,
        headers: {
          'Content-Type': 'audio/wav',
          'Cache-Control': 'private, no-store',
        },
      })
    }
    return NextResponse.json({ text: responseText, ttsError }, { status: 200 })
  } catch (error) {
    console.error('[Voice Demo] Error:', error)
    const message = error instanceof Error ? error.message : 'Demo failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
