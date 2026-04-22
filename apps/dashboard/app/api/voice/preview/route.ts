import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'
import { isSarvamConfigured, sarvamTts } from '@/lib/voice-agent/sarvam'

const MAX_PREVIEW_TEXT_LENGTH = 220
const DEFAULT_PREVIEW_TEXT = 'Namaste'

async function requirePreviewAuth(request: NextRequest) {
  const user = await authenticateRequest(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function HEAD(request: NextRequest) {
  const unauthorized = await requirePreviewAuth(request)
  if (unauthorized) return unauthorized

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Cache-Control': 'private, no-store',
    },
  })
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = await requirePreviewAuth(request)
    if (unauthorized) return unauthorized

    const { searchParams } = new URL(request.url)
    const text = (searchParams.get('text') || DEFAULT_PREVIEW_TEXT).trim()
    const lang = (searchParams.get('lang') || 'hi').trim().toLowerCase()
    const voiceId = (searchParams.get('voiceId') || undefined)?.trim()

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }
    if (text.length > MAX_PREVIEW_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `text must be <= ${MAX_PREVIEW_TEXT_LENGTH} characters` },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization')
    const gatewayToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader ?? undefined

    let audio: Buffer | null = null
    let contentType = 'audio/wav'
    let lastError: string | null = null

    // Prefer Sarvam for preview when available so local voice gateway route shape does not block UX.
    if (isSarvamConfigured()) {
      try {
        audio = await sarvamTts(text, lang, {
          speaker: voiceId,
          sampleRate: 24000,
          outputCodec: 'mp3',
        })
        contentType = 'audio/mpeg'
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Sarvam preview failed'
      }
    }

    if (!audio) {
      try {
        audio = await synthesizeSpeech(text, lang, voiceId, 1.0, { gatewayToken })
      } catch (err) {
        const baseError = err instanceof Error ? err.message : 'Preview failed'
        const merged = lastError ? `${lastError}; fallback error: ${baseError}` : baseError
        throw new Error(merged)
      }
    }

    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Preview failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
