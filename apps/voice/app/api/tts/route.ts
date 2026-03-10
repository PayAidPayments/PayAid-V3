import { NextRequest, NextResponse } from 'next/server'
import { generateTTS } from '@payaid/ai'

/**
 * GET/POST /api/tts – Text-to-speech with multi-provider fallback (vexyl → sarvam → coqui).
 * Query or body: text (required), lang (default hi).
 * Returns: audio/wav when a provider succeeds, or JSON { text, fallback: true } for text mode.
 */
export async function GET(request: NextRequest) {
  const text = request.nextUrl.searchParams.get('text')
  const lang = request.nextUrl.searchParams.get('lang') || 'hi'
  if (!text?.trim()) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }
  return handleTTS(text.trim(), lang)
}

export async function POST(request: NextRequest) {
  let body: { text?: string; lang?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const text = body.text?.trim()
  const lang = body.lang || 'hi'
  if (!text) {
    return NextResponse.json({ error: 'Missing text' }, { status: 400 })
  }
  return handleTTS(text, lang)
}

async function handleTTS(text: string, lang: string) {
  const result = await generateTTS(text, lang)
  if (result.audio) {
    return new NextResponse(result.audio, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  }
  return NextResponse.json({ text: result.text, fallback: true })
}
