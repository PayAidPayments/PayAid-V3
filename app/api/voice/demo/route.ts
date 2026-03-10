/**
 * POST /api/voice/demo
 * WebRTC-style demo: transcript + agentId → LLM → TTS → return audio.
 * Fast path: when SARVAM_API_KEY is set, uses Sarvam Chat + Bulbul TTS (Samvaad-like latency).
 * Otherwise: Groq-only LLM (no Ollama) + VEXYL/Coqui TTS. Always returns within ~9.5s.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { getGroqClient } from '@/lib/ai/groq'
import { isGroqConfigured } from '@/lib/voice-agent/llm'
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
ALWAYS: End calls positively. Use this closing phrase only: "Dhanyavaad, aapka din subh ho!" (not "accha ho").
`

const PAYAID_TELE_SALES_SCRIPT = `
You are a PayAid Payments tele-sales agent. Follow this flow and rules strictly.

PRODUCTS (get this right):
- Domestic payment gateway: for domestic payment acceptances only. Website: www.payaidpayments.com
- Cross-border payments: different platform, separate product. Website: www.payaidpayments.in
- We do NOT provide a single integration for both. Domestic and cross-border are separate products/platforms. Do not say "single integration for domestic and cross-border" or "one platform for both".
- Cross-border is only for businesses that can provide an invoice. It is NOT for individuals or for friends-and-family remittances. We only support inward remittances, not outward. If someone asks for personal remittance or sending money abroad, say cross-border is for business invoicing and inward remittances only.

SALES FLOW (ask in order; do not repeat if already answered):
1. Do they have a business / sell online? → 2. Do they have a website? → 3. Who is their existing payment gateway? → 4. For domestic: would they like to accept domestic payments (UPI, cards, wallets) via payaidpayments.com? For cross-border: only if they have a business that can invoice—we help with inward remittances at payaidpayments.in. Route transactions, avoid failures, increase success, all payment modes, affordability and security—but offer the right product (domestic vs cross-border) and correct website (.com vs .in).

MEMORY: Use the conversation history. Never ask again for something the user already said (e.g. if they said they have a website, do not ask again). When the user shares URL, email, mobile, or says they will call back, acknowledge and confirm what you noted ("Main ne note kar liya: ...") then ask for the next missing piece only.

CAPTURE ON CALLBACK: If the user says they will call back or want a callback, you MUST capture and confirm: (1) name, (2) mobile number, (3) time/date for callback. Say what you noted and close with "Dhanyavaad, aapka din subh ho!"

ONBOARDING (you do NOT help with integration): If they want to start or onboard—for domestic say visit www.payaidpayments.com to register; for cross-border (business with invoice, inward remittance only) say www.payaidpayments.in. Or offer: (a) share their email so we can send the proposal, or (b) mobile number to share more details. If they ask what documents are required: Business Owner KYC and Business KYC—duly signed and stamped.

PRICING: If they ask pricing or commercials, say pricing differs from business to business, then ask what category they fall into (e.g. retail, education, or which category).

CLOSING: Always end with "Dhanyavaad, aapka din subh ho!" (never "accha ho").

LANGUAGE: Use the configured language. Only switch when the user explicitly asks for another language or when their last message is clearly in that language. Do not switch on your own. One language per reply; do not mix.
`

const POLITENESS = `
TONE: Always speak with respect and courtesy (tamiz, adab). Use "aap", "ji", "kripya", "dhanyavaad". Never be abrupt, rude, or dismissive. If the user asks you to speak more politely, acknowledge and continue in a warm, respectful way.
`

const EMPATHY_AND_VOICE_STYLE = `
SOUND HUMAN: You are a real person on a call. Be warm, empathetic, and sympathetic. Show patience if the user is confused—rephrase kindly instead of repeating the same question. Use natural acknowledgments (e.g. "Achha", "Theek hai ji", "Samajh gaye") so the conversation feels natural, not robotic. Vary your phrasing; do not sound like a checklist. Sarvam TTS will speak your words—write in a way that sounds spoken: short, flowing sentences with a friendly tone. Avoid flat or bureaucratic wording.
`

function buildSystemPrompt(
  agent: { systemPrompt: string; language: string; voiceTone?: string | null; name?: string | null },
  language: string,
  context: string
): string {
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

  const responseLanguageRule = `
RESPONSE LANGUAGE: Speak only in ${langName} unless (1) the user explicitly asks you to use another language, or (2) the user's last message is clearly in another language (e.g. full sentence in Hindi/Tamil). Do not switch language on your own; stay in ${langName} until the user requests or clearly uses another language. One language per reply; never mix.
`

  let prompt = responseLanguageRule.trim()
  prompt += `\n\n${agent.systemPrompt}`
  const isTeleSales = agent.name && agent.name.toLowerCase().includes('tele-sales')
  if (isTeleSales) prompt += `\n\n${PAYAID_TELE_SALES_SCRIPT}`
  prompt += `\n\nDefault language: ${langName}. Only switch language when the user explicitly asks or when their message is clearly in another language.`
  prompt += POLITENESS
  prompt += EMPATHY_AND_VOICE_STYLE
  prompt += `\n\nCRITICAL - OUTPUT ONLY WHAT THE CUSTOMER HEARS: Reply with only the exact words the customer should hear (1-2 short sentences). Do not output your reasoning, drafts, alternatives, or meta-commentary. No "Attempt 1", "The response will be:", "Let's add...", bullet analysis, or internal notes. If you think of multiple phrasings, output only one final reply.`
  prompt += OBJECTION_HANDLING
  if (agent.voiceTone) prompt += `\n\nTone: ${agent.voiceTone}`
  if (context) prompt += `\n\nRelevant context:\n${context}`
  prompt += `\n\nKeep responses concise and natural for voice: 1-2 short sentences. Be warm and helpful, never curt. Use conversation history; do not ask again for information already given.`
  return prompt
}

// Sarvam path: allow enough time so slow turns return audio; frontend watchdog 27s.
const LLM_TIMEOUT_MS = 5000
const TTS_TIMEOUT_MS = 5000
const SARVAM_LLM_MS = 6000
const SARVAM_TTS_MS = 10000
const DEMO_OVERALL_MS = 25000 // 25s backend cap; frontend watchdog 27s
const VOICE_MAX_TOKENS = 90
const VOICE_TEMPERATURE = 0.4

function demoTimeoutResponse() {
  return NextResponse.json({
    text: 'Sorry, that took too long. Please try again with a shorter question.',
    audio: null,
    timedOut: true,
  })
}

export async function POST(request: NextRequest) {
  const routeStart = Date.now()
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

    // Free path: Groq only (no Ollama in this route)
    if (!isSarvamConfigured() && !isGroqConfigured()) {
      return NextResponse.json(
        {
          error: 'Voice demo needs a free LLM. Set GROQ_API_KEY in .env (get one at https://console.groq.com/keys). No payment required.',
        },
        { status: 503 }
      )
    }

    const timeoutPromise = new Promise<NextResponse>((resolve) =>
      setTimeout(() => resolve(demoTimeoutResponse()), DEMO_OVERALL_MS)
    )

    const toDemoMs = Date.now() - routeStart
    if (toDemoMs > 1000) console.warn('[Voice Demo] Slow before demo (auth/DB):', toDemoMs, 'ms')
    const demoPromise = (async (): Promise<NextResponse> => {
    const demoStart = Date.now()
    let context = ''
    try {
      const kbResults = await Promise.race([
        searchKnowledgeBase(agentId, transcript, 3),
        new Promise<null>((r) => setTimeout(() => r(null), 1500)),
      ]).then((r) => (Array.isArray(r) ? r : null))
      if (kbResults?.length) {
        context = kbResults.map((r) => r.content).join('\n\n')
      }
    } catch {
      // ignore
    }

    const systemPrompt = buildSystemPrompt(agent, agent.language, context)
    // Keep last 3 exchanges only so Groq stays fast (llm-benchmarks: Groq ~1–2s)
    const recentHistory = conversationHistory.slice(-6)
    const history = [...recentHistory, { role: 'user' as const, content: transcript }]

    let responseText: string
    let audio: Buffer | null = null
    let audioFormat: 'mp3' | 'wav' | undefined = undefined
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
        console.time('voice-llm')
        const res = await groq.chat(messages, {
          maxTokens: VOICE_MAX_TOKENS,
          signal: controller.signal,
        })
        console.timeEnd('voice-llm')
        clearTimeout(t)
        return res.message?.trim() || 'Please try again.'
      } catch (e) {
        clearTimeout(t)
        try { console.timeEnd('voice-llm') } catch { /* timer may not have been started */ }
        if ((e as Error)?.name === 'AbortError') timedOut = true
        return 'Sorry, connection was slow. Please say that again briefly.'
      }
    }

    async function ttsWithTimeout(text: string): Promise<Buffer | null> {
      try {
        console.time('voice-tts')
        const buf = await Promise.race([
          synthesizeSpeech(text, agent.language, agent.voiceId ?? undefined, 1.0, { ...voiceStyle, gatewayToken }),
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('TTS timeout')), TTS_TIMEOUT_MS)),
        ])
        console.timeEnd('voice-tts')
        return buf
      } catch (e) {
        console.timeEnd('voice-tts')
        ttsError = e instanceof Error ? e.message : String(e)
        console.warn('[Voice Demo] TTS timeout or fetch failed:', ttsError)
        return null
      }
    }

    // Path 1: Sarvam (real-time, Samvaad-like) with explicit timeouts so we don't hang
    if (isSarvamConfigured()) {
      console.log('[Voice Demo] Using Sarvam path (LLM + TTS)')
      const sarvamChatAbort = new AbortController()
      const sarvamChatTimer = setTimeout(() => sarvamChatAbort.abort(), SARVAM_LLM_MS)
      try {
        try {
          console.time('voice-sarvam-llm')
          responseText = await sarvamChat(systemPrompt, history, {
            temperature: VOICE_TEMPERATURE,
            signal: sarvamChatAbort.signal,
          })
          console.timeEnd('voice-sarvam-llm')
        } catch (e) {
          console.timeEnd('voice-sarvam-llm')
          clearTimeout(sarvamChatTimer)
          timedOut = (e as Error)?.name === 'AbortError'
          responseText = 'Sorry, connection was slow. Please say that again briefly.'
          if (!timedOut) throw e
        }
        clearTimeout(sarvamChatTimer)
        if (!timedOut) {
          const sarvamTtsAbort = new AbortController()
          const sarvamTtsTimer = setTimeout(() => sarvamTtsAbort.abort(), SARVAM_TTS_MS)
          try {
            console.time('voice-sarvam-tts')
            const ttsBuf = await Promise.race([
              sarvamTts(responseText, agent.language, {
                speaker: agent.voiceId || 'priya',
                sampleRate: 24000,
                signal: sarvamTtsAbort.signal,
                outputCodec: 'mp3',
              }),
              new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Sarvam TTS timeout')), SARVAM_TTS_MS)),
            ]).catch((e) => {
              ttsError = e instanceof Error ? e.message : String(e)
              console.warn('[Voice Demo] Sarvam TTS failed:', ttsError)
              return null
            })
            if (ttsBuf) {
              audio = ttsBuf as Buffer
              audioFormat = 'mp3'
            }
          } finally {
            clearTimeout(sarvamTtsTimer)
            console.timeEnd('voice-sarvam-tts')
          }
        }
      } catch (sarvamErr) {
        console.error('[Voice Demo] Sarvam chat failed, falling back to Groq for LLM:', sarvamErr)
        timedOut = false
        responseText = await groqDemoTurn()
        // Prefer Sarvam TTS for the Groq reply so user still gets Sarvam voice (no VEXYL/Coqui)
        const sarvamTtsAbort = new AbortController()
        const sarvamTtsTimer = setTimeout(() => sarvamTtsAbort.abort(), SARVAM_TTS_MS)
        try {
          console.time('voice-sarvam-tts-fallback')
          const ttsBuf = await Promise.race([
            sarvamTts(responseText, agent.language, {
              speaker: agent.voiceId || 'priya',
              sampleRate: 24000,
              signal: sarvamTtsAbort.signal,
              outputCodec: 'mp3',
            }),
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error('Sarvam TTS timeout')), SARVAM_TTS_MS)),
          ]).catch((e) => {
            ttsError = e instanceof Error ? e.message : String(e)
            console.warn('[Voice Demo] Sarvam TTS (fallback) failed:', ttsError)
            return null
          })
          if (ttsBuf) {
            audio = ttsBuf as Buffer
            audioFormat = 'mp3'
          }
          // When Sarvam is configured, do not fall back to VEXYL/Coqui (avoids "fetch failed" if they are down)
          else if (!isSarvamConfigured()) {
            audio = await ttsWithTimeout(responseText)
          }
        } finally {
          clearTimeout(sarvamTtsTimer)
          console.timeEnd('voice-sarvam-tts-fallback')
        }
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
        ...(audioFormat && { audioFormat }),
        ...(ttsError && { ttsError }),
        ...(timedOut && { timedOut: true }),
      })
    }
    if (audio) {
      return new NextResponse(audio, {
        status: 200,
        headers: {
          'Content-Type': audioFormat === 'mp3' ? 'audio/mpeg' : 'audio/wav',
          'Cache-Control': 'private, no-store',
        },
      })
    }
    const elapsed = Date.now() - demoStart
    if (elapsed > 5000) console.warn('[Voice Demo] Slow turn:', { elapsedMs: elapsed, hasAudio: !!audio })
    return NextResponse.json({ text: responseText, ttsError }, { status: 200 })
    })()

    return await Promise.race([demoPromise, timeoutPromise])
  } catch (error) {
    console.error('[Voice Demo] Error:', error)
    const message = error instanceof Error ? error.message : 'Demo failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
