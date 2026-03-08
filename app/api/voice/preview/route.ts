/**
 * GET /api/voice/preview
 * TTS preview for Agent Builder: ?text=Namaste&lang=hi&voiceId=arjun-formal
 * Returns audio/wav for live preview in wizard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'

const MAX_TEXT_LENGTH = 200

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const text = searchParams.get('text')?.trim() || 'Namaste'
    const lang = searchParams.get('lang') || 'hi'
    const voiceId = searchParams.get('voiceId') || 'arjun-formal'

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `Text too long (max ${MAX_TEXT_LENGTH} chars)` },
        { status: 400 }
      )
    }

    const audio = await synthesizeSpeech(text, lang, voiceId, 1.0, {
      voiceId,
      voiceStyle: voiceId?.includes('formal') ? 'formal' : voiceId?.includes('warm') ? 'warm' : 'calm',
    })

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'private, max-age=300',
      },
    })
  } catch (error) {
    console.error('[Voice Preview] Error:', error)
    const message = error instanceof Error ? error.message : 'Preview failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
