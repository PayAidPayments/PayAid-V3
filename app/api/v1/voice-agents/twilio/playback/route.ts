/**
 * Twilio playback URL for TTS audio
 * GET /api/v1/voice-agents/twilio/playback?callSid=xxx
 * Returns cached WAV for that call (set by speech-handler). No auth - URL is effectively signed by callSid.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPlayback } from '@/lib/voice-agent/playback-cache'

export async function GET(request: NextRequest) {
  const callSid = request.nextUrl.searchParams.get('callSid')
  if (!callSid) {
    return new NextResponse('Missing callSid', { status: 400 })
  }
  const buffer = getPlayback(callSid)
  if (!buffer) {
    return new NextResponse('Not found', { status: 404 })
  }
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'audio/wav',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
