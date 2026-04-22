import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/middleware/auth'
import { synthesizeSpeech } from '@/lib/voice-agent/tts'
import { isSarvamConfigured, sarvamTts } from '@/lib/voice-agent/sarvam'

const MAX_PREVIEW_TEXT_LENGTH = 220
const DEFAULT_PREVIEW_TEXT = 'नमस्ते! यह एक नमूना आवाज़ संदेश है।'

function inferVoiceToneFromId(voiceId?: string): 'calm' | 'warm' | 'formal' | undefined {
  if (!voiceId) return undefined
  const normalized = voiceId.toLowerCase()
  if (normalized.includes('warm')) return 'warm'
  if (normalized.includes('calm')) return 'calm'
  if (normalized.includes('formal')) return 'formal'
  return undefined
}

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

    let audio: Buffer
    let contentType = 'audio/wav'

    // Production-like preview path: Sarvam first and strict when configured.
    // This avoids falling into local VEXYL/Coqui dev misconfig paths that produce slow 500s.
    if (isSarvamConfigured()) {
      try {
        audio = await sarvamTts(text, lang, {
          speaker: voiceId,
          sampleRate: 24000,
          outputCodec: 'mp3',
        })
        contentType = 'audio/mpeg'
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Sarvam preview failed'
        throw new Error(`Sarvam voice preview failed: ${msg}`)
      }
    } else {
      try {
        const voiceTone = inferVoiceToneFromId(voiceId)
        audio = await synthesizeSpeech(text, lang, voiceId, 1.0, { gatewayToken, voiceTone })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Preview failed'
        throw new Error(`Voice preview backend is unavailable: ${msg}`)
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
