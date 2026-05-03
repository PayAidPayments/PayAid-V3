import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { synthesizeSpeech } from '@payaid/ai'
import { aiRouteTimer } from '@/lib/ai/ai-route-log'
import { z } from 'zod'

const bodySchema = z.object({
  text: z.string().min(1).max(5000),
  language: z.string().optional(),
  voiceId: z.string().optional(),
})

/**
 * POST /api/ai/audio/tts — canonical TTS (alias of behaviour for POST /api/ai/tts).
 */
export async function POST(request: NextRequest) {
  const timer = aiRouteTimer('audio/tts')
  try {
    await requireCanonicalAiGatewayAccess(request)
    const body = await request.json()
    const input = bodySchema.parse(body)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const out = await synthesizeSpeech(input.text, {
      language: input.language,
      voiceId: input.voiceId,
      bearerToken: token,
    })
    timer.success()
    return NextResponse.json({
      audioUrl: out.url,
      audioBase64: out.audioBase64,
      provider: out.provider,
    })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    timer.failure(err)
    console.error('/api/ai/audio/tts error:', err)
    const message = err instanceof Error ? err.message : 'TTS failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
