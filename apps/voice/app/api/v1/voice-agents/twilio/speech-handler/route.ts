/**
 * Twilio Gather (speech) action handler
 * POST from Twilio with CallSid, SpeechResult → LLM + TTS → cache audio → return TwiML with <Play> + next <Gather>
 */

import { NextRequest, NextResponse } from 'next/server'
import twilio from 'twilio'
import { prisma } from '@payaid/db'
import { generateVoiceResponse } from '@/lib/voice-agent/llm'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'
import { searchKnowledgeBase } from '@/lib/voice-agent/knowledge-base'
import { setPlayback } from '@/lib/voice-agent/playback-cache'
import {
  detectRequestedLanguageSwitch,
  getLanguageSwitchAcknowledgement,
  normalizeLanguageCode,
  toTwilioGatherLanguage,
} from '@/lib/voice-agent/language-switch'

const VoiceResponse = twilio.twiml.VoiceResponse

const OBJECTION_HANDLING = `
MUST handle objections professionally:
- "No money" / "Paise nahi hai": Offer EMI. "Samajhta hun. Kya EMI option dekhna chahenge?"
- "Wrong number" / "Galat number": Apologise and end. "Maaf kijiye galti se call aayi."
- "Talk to boss" / "Boss se baat karo": Take callback. "Theek hai ji. Callback number de dijiye?"
ALWAYS: Polite, professional; concise for voice.
`

function resolveConversationStyle(workflow: unknown): 'casual' | 'neutral' | 'professional' {
  if (!workflow || typeof workflow !== 'object') return 'neutral'
  const raw = (workflow as { conversationStyle?: unknown }).conversationStyle
  if (raw === 'casual' || raw === 'neutral' || raw === 'professional') {
    return raw
  }
  return 'neutral'
}

function buildSystemPrompt(
  agent: { systemPrompt: string; language: string; voiceTone?: string | null; workflow?: unknown },
  context: string
): string {
  const conversationStyle = resolveConversationStyle(agent.workflow)
  const styleInstruction: Record<'casual' | 'neutral' | 'professional', string> = {
    casual: 'Use casual everyday wording, like a normal friendly conversation.',
    neutral: 'Use clear, balanced day-to-day wording.',
    professional: 'Use professional but modern and simple wording.',
  }

  let prompt = agent.systemPrompt + '\n\n' + OBJECTION_HANDLING
  if (agent.voiceTone) prompt += `\nTone: ${agent.voiceTone}.`
  prompt += `\nConversation style: ${conversationStyle}. ${styleInstruction[conversationStyle]}`
  if (context) prompt += `\nRelevant context:\n${context}`
  prompt += '\nKeep responses concise and natural for voice.'
  prompt += '\nUse everyday modern speech. Avoid archaic, bookish, or overly formal wording.'
  return prompt
}

function parseHistory(transcript: string | null): Array<{ role: string; content: string }> {
  if (!transcript?.trim()) return []
  try {
    const arr = JSON.parse(transcript) as Array<{ role?: string; content?: string }>
    if (!Array.isArray(arr)) return []
    return arr
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role!, content: m.content!.slice(0, 2000) }))
      .slice(-10)
  } catch {
    return []
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get('CallSid')?.toString()
    const speechResult = formData.get('SpeechResult')?.toString()?.trim()
    const callStatus = formData.get('CallStatus')?.toString()

    if (!callSid) {
      const twiml = new VoiceResponse()
      twiml.say({ voice: 'alice', language: 'en-US' }, 'Sorry, we could not identify the call.')
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
    }

    const call = await prisma.voiceAgentCall.findFirst({
      where: { callSid },
      include: { agent: true },
    })
    if (!call) {
      const twiml = new VoiceResponse()
      twiml.say({ voice: 'alice', language: 'en-US' }, 'Session expired. Goodbye.')
      twiml.hangup()
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
    }

    const agent = call.agent
    const baseUrl = request.nextUrl.origin
    const speechHandlerUrl = `${baseUrl}/api/v1/voice-agents/twilio/speech-handler`
    const playbackUrl = `${baseUrl}/api/v1/voice-agents/twilio/playback?callSid=${encodeURIComponent(callSid)}`

    const activeLanguage = normalizeLanguageCode(call.languageUsed || agent.language || 'en')

    if (callStatus === 'completed') {
      const twiml = new VoiceResponse()
      twiml.say({ voice: 'alice', language: toTwilioGatherLanguage(activeLanguage) }, 'Thank you for calling. Goodbye.')
      twiml.hangup()
      return new NextResponse(twiml.toString(), { headers: { 'Content-Type': 'text/xml' } })
    }

    const userText = speechResult || '(no speech)'
    const history = parseHistory(call.transcript)
    history.push({ role: 'user', content: userText })

    const requestedSwitch = detectRequestedLanguageSwitch(userText, activeLanguage)
    if (requestedSwitch) {
      const switchAck = getLanguageSwitchAcknowledgement(requestedSwitch)

      history.push({ role: 'assistant', content: switchAck })

      const audio = await synthesizeSpeech(
        switchAck,
        requestedSwitch,
        agent.voiceId ?? undefined,
        1.0,
        agent.voiceTone ? { voiceTone: agent.voiceTone } : undefined
      )
      setPlayback(callSid, audio)

      await prisma.voiceAgentCall.update({
        where: { id: call.id },
        data: {
          transcript: JSON.stringify(history),
          languageUsed: requestedSwitch,
          status: 'in-progress',
        },
      })

      const twiml = new VoiceResponse()
      twiml.play(playbackUrl)
      twiml.gather({
        input: ['speech'],
        action: speechHandlerUrl,
        method: 'POST',
        language: toTwilioGatherLanguage(requestedSwitch),
        speechTimeout: 2,
        timeout: 5,
      })
      twiml.redirect(speechHandlerUrl)

      return new NextResponse(twiml.toString(), {
        headers: { 'Content-Type': 'text/xml', 'Cache-Control': 'no-cache' },
      })
    }

    let context = ''
    try {
      const kb = await searchKnowledgeBase(agent.id, userText, 3)
      if (kb?.length) context = kb.map((r) => r.content).join('\n\n')
    } catch {}

    const systemPrompt = buildSystemPrompt(agent, context)
    const responseText = await generateVoiceResponse(systemPrompt, history, activeLanguage)
    history.push({ role: 'assistant', content: responseText })

    const audio = await synthesizeSpeech(
      responseText,
      activeLanguage,
      agent.voiceId ?? undefined,
      1.0,
      agent.voiceTone ? { voiceTone: agent.voiceTone } : undefined
    )
    setPlayback(callSid, audio)

    await prisma.voiceAgentCall.update({
      where: { id: call.id },
      data: {
        transcript: JSON.stringify(history),
        languageUsed: activeLanguage,
        status: 'in-progress',
      },
    })

    const twiml = new VoiceResponse()
    twiml.play(playbackUrl)
    twiml.gather({
      input: ['speech'],
      action: speechHandlerUrl,
      method: 'POST',
      language: toTwilioGatherLanguage(activeLanguage),
      speechTimeout: 2,
      timeout: 5,
    })
    twiml.redirect(speechHandlerUrl)

    return new NextResponse(twiml.toString(), {
      headers: { 'Content-Type': 'text/xml', 'Cache-Control': 'no-cache' },
    })
  } catch (error) {
    console.error('[Twilio SpeechHandler] Error:', error)
    const twiml = new VoiceResponse()
    twiml.say({ voice: 'alice', language: 'en-US' }, 'Sorry, something went wrong. Please try again.')
    twiml.redirect(request.nextUrl.origin + '/api/v1/voice-agents/twilio/speech-handler')
    return new NextResponse(twiml.toString(), { status: 500, headers: { 'Content-Type': 'text/xml' } })
  }
}
