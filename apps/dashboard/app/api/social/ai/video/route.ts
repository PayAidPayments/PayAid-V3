import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const bodySchema = z.object({
  prompt: z.string().min(1),
  imageUrls: z.array(z.string().url()).optional().default([]),
  script: z.string().optional(),
  durationSeconds: z.number().min(5).max(60).optional().default(30),
})

const VIDEO_WORKER_URL = process.env.VIDEO_WORKER_URL || process.env.FFMPEG_WORKER_URL

/**
 * POST /api/social/ai/video
 * Self-hosted video gen: FFmpeg + Coqui TTS from images + script → ~30s UGC.
 * If VIDEO_WORKER_URL/FFMPEG_WORKER_URL is set, calls worker; else returns placeholder.
 */
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const { prompt, imageUrls, script, durationSeconds } = bodySchema.parse(body)

    if (VIDEO_WORKER_URL) {
      const res = await fetch(`${VIDEO_WORKER_URL.replace(/\/$/, '')}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          imageUrls: imageUrls ?? [],
          script: script ?? prompt.trim(),
          durationSeconds,
        }),
      })
      if (!res.ok) {
        const err = await res.text()
        console.error('Video worker error:', err)
        return NextResponse.json(
          { error: 'Video generation failed', hint: err?.slice?.(0, 200) },
          { status: 502 }
        )
      }
      const data = await res.json()
      const videoUrl = data.videoUrl ?? data.url
      if (!videoUrl) {
        return NextResponse.json(
          { error: 'No video URL from worker' },
          { status: 502 }
        )
      }
      return NextResponse.json({
        id: data.id ?? `video-${Date.now()}`,
        url: videoUrl,
        thumbnailUrl: data.thumbnailUrl,
      })
    }

    // No worker: return placeholder so UI can still flow (e.g. "Add VIDEO_WORKER_URL for UGC video")
    return NextResponse.json(
      {
        id: `placeholder-video-${Date.now()}`,
        url: '',
        thumbnailUrl: '',
        _placeholder: true,
        hint: 'Set VIDEO_WORKER_URL or FFMPEG_WORKER_URL for self-hosted UGC video (FFmpeg + Coqui TTS).',
      },
      { status: 200 }
    )
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    console.error('Social AI video error:', err)
    return NextResponse.json({ error: 'Failed to generate video' }, { status: 500 })
  }
}
