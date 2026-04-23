// @ts-nocheck
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
You are Priya, a professional sales agent for PayAid Payments Pvt Ltd. You represent the company on outbound and inbound calls. Sound confident, warm, and concise—never robotic or like a rigid survey.

COMPANY & VALUE (use when relevant, in one short beat):
- PayAid Payments Pvt Ltd helps businesses accept payments online reliably and grow: UPI, cards, netbanking, wallets, and more—strong success rates, security, and support for Indian businesses.
- When appropriate, say one line that PayAid can help them scale collections and reduce failed payments—do not over-promise or compare with unnamed competitors.

PRODUCTS (must be accurate):
- Domestic payment gateway: India payments only. Signup and info: www.payaidpayments.com
- Cross-border: separate product/platform. www.payaidpayments.in — business invoicing and inward remittances only; not for individuals or friends-and-family; not for sending money abroad.
- Never say one integration covers both domestic and cross-border.

DISCOVERY FLOW (one question per reply; skip steps already answered in history):
1) Greeting + light rapport (if they already said how they are, do not ask again).
2) Do they run a business or sell products/services online?
3) Do they have a website or app for sales? If yes, ask for the URL once and confirm it back clearly.
4) What payment methods or gateway do they use today, if any?
5) Brief fit: domestic (.com) vs cross-border (.in) only if relevant—match their need.

ANTI-REPETITION (critical): Read the full conversation history before every reply. If the user already answered "yes" to selling online or gave a website, do NOT ask those questions again. Move to the next missing fact. If they already confirmed a URL, do not re-ask unless they correct it.

CONFIRM DETAILS: When you capture name, phone, email, or website, repeat it back once in short form ("I've noted your site as …") so they can correct you.

SIGNUP & NEXT STEPS:
- To self-serve: domestic → register at www.payaidpayments.com; cross-border (eligible businesses) → www.payaidpayments.in
- Offer a human or specialist: if they want detailed pricing, legal terms, deep integration, or say they prefer a person—offer to have the team call or email them; collect name + mobile + email if missing.

WHEN TO INVOLVE A REAL PERSON (say clearly and offer callback):
- Complex pricing, enterprise deal, custom integration, or legal/compliance questions you cannot answer in one short line.
- They insist on speaking to a human, are angry, or the request is outside PayAid products.
- You do not guess—offer to arrange a callback from the team.

OBJECTIONS & REJECTIONS:
- "Not interested" / busy: acknowledge, offer to send one line by email or a callback later—no pressure.
- "Too expensive" / "happy with current provider": acknowledge; one line on fit and reliability; offer to share pricing or a comparison sheet via email—never insult competitors.
- Competitor comparison: stay factual and respectful—highlight PayAid strengths (security, modes, support, India focus) without naming or slurring competitors unless the user names one (then stay polite and factual).

CALLBACKS: If they want a call back, capture and confirm: name, mobile, preferred day/time window, and timezone if relevant. Repeat back. Close politely.

DOCUMENTS (if asked): Business Owner KYC and Business KYC—duly signed and stamped—as applicable.

PRICING: Say pricing varies by business; ask their category (e.g. retail, education, SaaS); offer specialist follow-up for exact numbers.

HINDI CLOSING: End with "Dhanyavaad, aapka din subh ho!" when speaking Hindi (never "accha ho").

LANGUAGE: Use the configured language unless the user clearly switches; one language per reply.
`

/** When agent + user are in English, override Hindi lines embedded in tele-sales / objection blocks above. */
const TELE_SALES_ENGLISH_OVERRIDE = `
ENGLISH TELE-SALES (overrides Hindi examples above): Your reply language is English—do not use Hindi objection scripts or Hindi closings from earlier sections. Introduce yourself as Priya from PayAid Payments Pvt Ltd when it fits naturally (not every single turn). For objections, paraphrase in clear English (e.g. wrong number: "I'm sorry for the trouble—we won't use this number again."). For notes: say "I've noted that…". Standard polite closing in English: "Thank you, and have a great day!" (not "Dhanyavaad" or "namaste"). Callback confirm: use English date/time phrasing.
`

const POLITENESS_ENGLISH = `
TONE (English only): Be polite and professional in standard English. Use "please", "thank you", "I'd be glad to", "certainly", "of course". Sound warm but clear—never curt. If the user asks you to be more polite, acknowledge briefly and continue courteously.
`

const EMPATHY_ENGLISH = `
SOUND HUMAN (English only): You are on a real phone call. Be warm and empathetic. If the user is confused, rephrase simply and kindly. Use natural English acknowledgments only—e.g. "I understand", "sure", "absolutely", "got it", "no problem at all". Do not use Hindi or Hinglish fillers. Keep sentences short and conversational.
`

const ENGLISH_NO_HINGLISH = `
ENGLISH-ONLY REPLIES (critical): When your response language is English, use **only English words**. Do not use Hindi/Hinglish terms or fillers—avoid words like "ji", "namaste", "acha/achha", "theek", "haan", "kripya", "dhanyavaad", "bas", "matlab", "suniye", or mixed phrases like "OK ji". Say "hello" or "good day" instead of "namaste" if you need a greeting in English. Politeness must sound natural in English, not Indian English mixed with Hindi unless the user is clearly speaking Hindi with you.
`

const POLITENESS_HINDI = `
TONE: Always speak with respect and courtesy (tamiz, adab). Use "aap", "ji", "kripya", "dhanyavaad". Never be abrupt, rude, or dismissive. If the user asks you to speak more politely, acknowledge and continue in a warm, respectful way.
`

const EMPATHY_HINDI = `
SOUND HUMAN: You are a real person on a call. Be warm, empathetic, and sympathetic. Show patience if the user is confused—rephrase kindly instead of repeating the same question. Use natural acknowledgments (e.g. "Achha", "Theek hai ji", "Samajh gaye") so the conversation feels natural, not robotic. Vary your phrasing; do not sound like a checklist. Sarvam TTS will speak your words—write in a way that sounds spoken: short, flowing sentences with a friendly tone. Avoid flat or bureaucratic wording.
`

const HINDI_WARMTH = `
HINDI DELIVERY (mandatory when speaking Hindi): Sound gentle, caring, and respectful—like a helpful colleague, never cold or like an interrogation. Soften questions with brief acknowledgments first ("Achha ji…", "Theek hai…"). If the user apologizes, asks you to repeat, or seems unsure, respond with reassurance first ("Bilkul, koi baat nahi ji…", "Zaroor, main dohraati hoon…") before continuing. Avoid blunt yes/no stacks; add one human beat between questions. Never sound irritated, rushed, or dismissive—your voice should feel sympathetic even when you must ask for business details.
`

const POLITENESS_TELUGU = `
TONE (Telugu): మర్యాదగా, సహజంగా మాట్లాడండి. "మీరు", "దయచేసి", "ధన్యవాదాలు" వాడండి. ఎప్పుడూ తిడవద్దు లేదా శుష్కంగా ఉండవద్దు.
`

const EMPATHY_TELUGU = `
SOUND HUMAN (Telugu): నిజమైన కాల్ లాగా—చదవకండి. ఒక వాక్యంలో ఒక సహజ ప్రతిస్పందన (అవునా?, అర్థమైంది, ఓహ్) చేర్చండి. కస్టమర్ కోపంగా లేదా కన్‌ఫ్యూజ్‌గా ఉంటే మొదట సమాధానం ఇవ్వండి, తర్వాతే వివరాలు అడగండి. పదే పదే ఒకే ప్రశ్న వేదంలా అడగకండి—సంభాషణ మార్చండి.
`

const TELUGU_WARMTH = `
TELUGU DELIVERY: మృదువుగా, సహాయకంగా ఉండండి—ఇంటర్వ్యూ లా కాదు. ప్రశ్నకు ముందు చిన్న అంగీకారం ("సరే అండి…", "అవును…"). హిందీ లేదా ఇంగ్లీష్ ఫిల్లర్లు వేసి తెలుగును కలుపకండి unless the user mixes languages.
`

/** TTS reads text literally—prosody comes from wording; bulbul:v3 also uses temperature for variety. */
const VOICE_EMOTION_TELECALLER = `
VOICE PERFORMANCE: You are a live tele-caller, not reading a script. Write 1–2 short sentences that sound *spoken*: natural reactions (surprise, concern, warmth, relief) using words and light punctuation—never stage directions or bracketed emotions. Match the customer's energy: if they are upset, acknowledge first; if they share good news, sound pleased. Avoid robotic listing, repeated stock phrases every turn, or flat tone. Stay professional: empathetic, not theatrical rage.
`

function extractUrlCandidate(text: string): string | null {
  const normalized = text
    .replace(/\s*\.\s*/g, '.')
    .replace(/\s+/g, ' ')
    .trim()
  const m = normalized.match(/\b(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?\b/i)
  return m?.[0] || null
}

function deriveConversationFacts(
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  transcript: string
): { hasWebsite: boolean; websiteUrl?: string; websiteCorrectionRequested: boolean } {
  const all = [...history, { role: 'user' as const, content: transcript }]
  const joined = all.map((m) => m.content.toLowerCase()).join('\n')

  const hasWebsite =
    /\b(we have a website|have a website|website|site|web app|app)\b/i.test(joined) ||
    all.some((m) => !!extractUrlCandidate(m.content))

  const correctionRequested =
    /\b(incorrect|wrong|you got it wrong|not correct|no,|i said|that's not|that is not)\b/i.test(
      transcript.toLowerCase()
    )

  let websiteUrl: string | undefined
  for (let i = all.length - 1; i >= 0; i--) {
    const candidate = extractUrlCandidate(all[i].content)
    if (candidate) {
      websiteUrl = candidate
      break
    }
  }

  return {
    hasWebsite,
    websiteUrl,
    websiteCorrectionRequested: correctionRequested,
  }
}

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
  const isEnglish =
    langName === 'English' || (language != null && language.toLowerCase().startsWith('en'))
  const isHindi = langName === 'Hindi' || (language != null && language.toLowerCase().startsWith('hi'))
  const isTelugu = langName === 'Telugu' || (language != null && language.toLowerCase().startsWith('te'))

  const responseLanguageRule = `
RESPONSE LANGUAGE: Speak only in ${langName} unless (1) the user explicitly asks you to use another language, or (2) the user's last message is clearly in another language (e.g. full sentence in Hindi/Tamil). Do not switch language on your own; stay in ${langName} until the user requests or clearly uses another language. One language per reply; never mix.
`

  let prompt = responseLanguageRule.trim()
  prompt += `\n\n${agent.systemPrompt}`
  const isTeleSales = agent.name && agent.name.toLowerCase().includes('tele-sales')
  if (isTeleSales) prompt += `\n\n${PAYAID_TELE_SALES_SCRIPT}`
  if (isTeleSales && isEnglish) prompt += `\n\n${TELE_SALES_ENGLISH_OVERRIDE}`
  prompt += `\n\nDefault language: ${langName}. Only switch language when the user explicitly asks or when their message is clearly in another language.`

  if (isEnglish) {
    prompt += POLITENESS_ENGLISH
    prompt += EMPATHY_ENGLISH
    prompt += ENGLISH_NO_HINGLISH
  } else if (isTelugu) {
    prompt += POLITENESS_TELUGU
    prompt += EMPATHY_TELUGU
    prompt += TELUGU_WARMTH
    prompt += VOICE_EMOTION_TELECALLER
  } else {
    prompt += POLITENESS_HINDI
    prompt += EMPATHY_HINDI
    if (isHindi) {
      prompt += HINDI_WARMTH
    }
    if (isTeleSales) {
      prompt += VOICE_EMOTION_TELECALLER
    }
  }
  prompt += `\n\nCRITICAL - OUTPUT ONLY WHAT THE CUSTOMER HEARS: Reply with only the exact words the customer should hear (1-2 short sentences). Do not output your reasoning, drafts, alternatives, or meta-commentary. No "Attempt 1", "The response will be:", "Let's add...", bullet analysis, or internal notes. If you think of multiple phrasings, output only one final reply.`
  prompt += OBJECTION_HANDLING
  if (agent.voiceTone) prompt += `\n\nTone: ${agent.voiceTone}`
  if (context) prompt += `\n\nRelevant context:\n${context}`
  prompt += `\n\nKeep responses concise and natural for voice: 1-2 short sentences. Be warm and helpful, never curt. Use conversation history; do not ask again for information already given.`
  return prompt
}

// LLM/TTS timeouts: long English or Hindi replies + Sarvam need >6s TTS; short caps caused AbortError ("This operation was aborted").
const LLM_TIMEOUT_MS = 5500
const TTS_TIMEOUT_MS = 9000
const SARVAM_LLM_MS = 6500
const SARVAM_TTS_MS = 11_000
const DEMO_OVERALL_MS = 19_000 // Keep turn latency realistic; fail fast instead of long dead-air waits
const VOICE_MAX_TOKENS = 60
const VOICE_TEMPERATURE = 0.45
/** bulbul:v3: slightly higher = more natural prosody (less “flat”); tune 0.65–0.85 */
const SARVAM_TTS_TEMPERATURE = 0.78
const SARVAM_TTS_PACE = 1.05

function demoTimeoutResponse() {
  return NextResponse.json({
    text: 'Sorry, that took a moment. Please say that again briefly.',
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
        new Promise<null>((r) => setTimeout(() => r(null), 600)),
      ]).then((r) => (Array.isArray(r) ? r : null))
      if (kbResults?.length) {
        context = kbResults.map((r) => r.content).join('\n\n')
      }
    } catch {
      // ignore
    }

    // Keep enough context to avoid asking repeated discovery questions.
    const recentHistory = conversationHistory.slice(-8)
    const facts = deriveConversationFacts(recentHistory, transcript)
    if (facts.hasWebsite) {
      context += `\nKnown call facts: customer already confirmed they have a website${
        facts.websiteUrl ? ` (${facts.websiteUrl})` : ''
      }. Do NOT ask whether they have a website/app again unless the customer explicitly says earlier details are wrong.`
    }
    if (facts.websiteCorrectionRequested) {
      context += `\nCustomer says previously captured website details are incorrect. Enter correction mode: ask one concise clarification question, confirm the corrected URL back once, then continue.`
    }

    const systemPrompt = buildSystemPrompt(agent, agent.language, context)
    const history = [...recentHistory, { role: 'user' as const, content: transcript }]

    let responseText: string
    let audio: Buffer | null = null
    let audioFormat: 'mp3' | 'wav' | undefined = undefined
    let ttsError: string | null = null
    let timedOut = false
    const authHeader = request.headers.get('authorization')
    const gatewayToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader ?? undefined
    const teleSales = agent.name?.toLowerCase().includes('tele-sales')
    const effectiveVoiceTone = agent.voiceTone ?? (teleSales ? 'warm' : undefined)
    const voiceStyle = effectiveVoiceTone ? { voiceTone: effectiveVoiceTone } : undefined

    async function groqDemoTurn(): Promise<string> {
      const controller = new AbortController()
      const t = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS)
      try {
        const groq = getGroqClient()
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...history.slice(-10).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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
                sampleRate: 16000,
                signal: sarvamTtsAbort.signal,
                outputCodec: 'mp3',
                temperature: SARVAM_TTS_TEMPERATURE,
                pace: SARVAM_TTS_PACE,
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
              sampleRate: 16000,
              signal: sarvamTtsAbort.signal,
              outputCodec: 'mp3',
              temperature: SARVAM_TTS_TEMPERATURE,
              pace: SARVAM_TTS_PACE,
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
