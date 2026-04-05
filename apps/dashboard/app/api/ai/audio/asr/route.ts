import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { transcribeAudio } from '@payaid/ai'
import { aiRouteTimer } from '@/lib/ai/ai-route-log'
import { z } from 'zod'

const bodySchema = z.object({
  audioUrl: z.string().url(),
  language: z.string().optional(),
  task: z.enum(['transcribe', 'translate']).optional(),
})

/**
 * POST /api/ai/audio/asr — canonical speech-to-text (alias of POST /api/ai/transcribe).
 */
export async function POST(request: NextRequest) {
  const timer = aiRouteTimer('audio/asr')
  try {
    await requireCanonicalAiGatewayAccess(request)
    const body = await request.json()
    const input = bodySchema.parse(body)
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')
    const text = await transcribeAudio(input.audioUrl, {
      bearerToken: token,
      language: input.language,
      task: input.task,
    })
    timer.success()
    return NextResponse.json({ text })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    timer.failure(err)
    console.error('/api/ai/audio/asr error:', err)
    const message = err instanceof Error ? err.message : 'Transcription failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
