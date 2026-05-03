import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { videoFromImage } from '@payaid/ai'
import { z } from 'zod'

const bodySchema = z.object({
  /** HTTPS URL or data:image/*;base64,... (generated creatives are often data URLs). */
  imageUrl: z
    .string()
    .min(1)
    .refine(
      (s) =>
        /^https?:\/\//i.test(s) ||
        (s.startsWith('data:image/') && (s.includes(';base64,') || s.includes(','))),
      { message: 'Must be an http(s) URL or a data:image URL' }
    ),
  prompt: z.string().optional(),
  durationSec: z.number().min(3).max(60).optional(),
  aspectRatio: z.enum(['9:16', '16:9']).optional(),
  script: z.string().max(20000).optional(),
  scenePlan: z.string().max(20000).optional(),
  voiceoverText: z.string().max(20000).optional(),
  referenceAudioUrl: z.string().url().optional(),
  lipSync: z.boolean().optional(),
  shotCount: z.number().int().min(1).max(24).optional(),
  fps: z.number().int().min(8).max(60).optional(),
  seed: z.number().int().optional(),
  mediaAssetId: z.string().optional(),
})

/**
 * POST /api/ai/video/from-image — queued image→video (Marketing Studio reels/shorts).
 * Same queue as POST /api/ai/video; this route requires imageUrl for clarity.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireCanonicalAiGatewayAccess(request)
    const body = await request.json()
    const input = bodySchema.parse(body)
    const job = await videoFromImage({
      imageUrl: input.imageUrl,
      prompt: input.prompt,
      durationSec: input.durationSec,
      aspectRatio: input.aspectRatio,
      tenantId,
      options: {
        script: input.script,
        scenePlan: input.scenePlan,
        voiceoverText: input.voiceoverText,
        referenceAudioUrl: input.referenceAudioUrl,
        lipSync: input.lipSync,
        shotCount: input.shotCount,
        fps: input.fps,
        seed: input.seed,
      },
    })
    return NextResponse.json({ ...job, mediaAssetId: input.mediaAssetId })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    console.error('/api/ai/video/from-image error:', err)
    const message = err instanceof Error ? err.message : 'Video job failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
