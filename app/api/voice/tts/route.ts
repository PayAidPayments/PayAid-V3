/**
 * /api/voice/tts
 * GET  - TTS options (languages, speakers) for Voice Agent config UI
 * POST - Text-to-Speech: VEXYL when configured, else Coqui/Bhashini/IndicParler
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'
import { getVexylLanguages, getVexylSpeakers, isVexylConfigured } from '@/lib/voice-agent/vexyl-tts'
import { z } from 'zod'

const bodySchema = z.object({
  text: z.string().min(1).max(5000),
  language: z.string().min(2).max(10).default('en'),
  speaker: z.string().optional(),
  voiceStyle: z.enum(['calm', 'warm', 'formal']).optional(),
  format: z.enum(['wav', 'mp3']).optional(),
})

/** GET /api/voice/tts - Return TTS options for agent config (languages, speakers) */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const languages = getVexylLanguages()
    const speakers = getVexylSpeakers()
    const vexylConfigured = isVexylConfigured()
    return NextResponse.json({
      languages,
      speakers,
      vexylConfigured,
    })
  } catch (error) {
    console.error('[Voice TTS] GET options error:', error)
    return NextResponse.json({ error: 'Failed to get TTS options' }, { status: 500 })
  }
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

    const { text, language, speaker, voiceStyle } = parsed.data

    const audio = await synthesizeSpeech(
      text,
      language,
      speaker,
      1.0,
      { voiceStyle: voiceStyle ?? undefined }
    )

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('[Voice TTS] Error:', error)
    const message = error instanceof Error ? error.message : 'TTS failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
