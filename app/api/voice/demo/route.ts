/**
 * POST /api/voice/demo
 * WebRTC-style demo: transcript + agentId → LLM → TTS → return audio.
 * Fast path: when SARVAM_API_KEY is set, uses Sarvam Chat + Bulbul TTS (Samvaad-like latency).
 * Otherwise: Groq/Ollama LLM + VEXYL/Coqui TTS.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getGroqClient } from '@/lib/ai/groq'
import { generateVoiceResponse, isGroqConfigured } from '@/lib/voice-agent/llm'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'
import { isSarvamConfigured, sarvamChat, sarvamTts } from '@/lib/voice-agent/sarvam'
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
  prompt += `\n\nKeep responses concise and natural, suitable for voice conversation. Answer in 1-2 short sentences unless asked for detail.`
  return prompt
}

// Hard caps: LLM 4s + TTS 4s = 8s max total → fallback to text, no hang (Groq ~2s + TTS ~3s typical)
const LLM_TIMEOUT_MS = 4000
const TTS_TIMEOUT_MS = 4000
const VOICE_MAX_TOKENS = 120
const VOICE_TEMPERATURE = 0.3

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

    // Free path requires Groq (free tier) for acceptable latency; avoid 2+ min Ollama wait
    if (!isSarvamConfigured() && !isGroqConfigured()) {
      return NextResponse.json(
        {
          error: 'Voice demo needs a free LLM. Set GROQ_API_KEY in .env (get one at https://console.groq.com/keys). No payment required.',
        },
        { status: 503 }
      )
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
    const maxHistory = 10
    const recentHistory = conversationHistory.slice(-maxHistory)
    const history = [...recentHistory, { role: 'user' as const, content: transcript }]

    let responseText: string
    let audio: Buffer | null = null
    let ttsError: string | null = null
    let timedOut = false
    const authHeader = request.headers.get('authorization')
    const gatewayToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader ?? undefined
    const voiceStyle = agent.voiceTone ? { voiceTone: agent.voiceTone } : undefined

    async function groqDemoTurn(): Promise<string> {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)
      try {
        const groq = getGroqClient()
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...history.slice(-5).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ]
        const res = await groq.chat(messages, {
          maxTokens: VOICE_MAX_TOKENS,
          signal: controller.signal,
        })
        clearTimeout(t)
        return res.message?.trim() || 'Please try again.'
      } catch (e) {
        clearTimeout(t)
        if ((e as Error)?.name === 'AbortError') timedOut = true
        return 'Sorry, connection was slow. Please say that again briefly.'
      }
    }

    async function ttsWithTimeout(text: string): Promise<Buffer | null> {
      try {
        return await Promise.race([
          synthesizeSpeech(text, agent.language, agent.voiceId ?? undefined, 1.0, { ...voiceStyle, gatewayToken }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), TTS_TIMEOUT_MS)),
        ])
      } catch (e) {
        ttsError = e instanceof Error ? e.message : String(e)
        return null
      }
    }

    // Path 1: Sarvam (optional paid) with timeouts
    if (isSarvamConfigured()) {
      try {
        try {
          responseText = await sarvamChat(systemPrompt, history, { temperature: VOICE_TEMPERATURE })
        } catch (e) {
          timedOut = (e as Error)?.name === 'AbortError'
          responseText = 'Sorry, connection was slow. Please say that again briefly.'
          if (!timedOut) throw e
        }
        if (!timedOut) {
          const ttsBuf = await Promise.race([
            sarvamTts(responseText, agent.language, { speaker: agent.voiceId || 'priya', sampleRate: 24000 }),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), TTS_TIMEOUT_MS)),
          ]).catch(() => null)
          if (ttsBuf) audio = ttsBuf as Buffer
        }
      } catch (sarvamErr) {
        console.error('[Voice Demo] Sarvam path failed, falling back to Groq:', sarvamErr)
        timedOut = false
        responseText = await groqDemoTurn()
        audio = await ttsWithTimeout(responseText)
      }
    } else {
      // Path 2: Groq only (free), 8s LLM + 5s TTS
      responseText = await groqDemoTurn()
      if (responseText.startsWith('Sorry, connection was slow')) timedOut = true
      else audio = await ttsWithTimeout(responseText)
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
        ...(timedOut && { timedOut: true }),
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
