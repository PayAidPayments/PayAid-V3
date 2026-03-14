import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { isSelfHostedImageAvailable, generateSelfHostedImage } from '@/lib/ai/self-hosted-image'

const bodySchema = z.object({
  prompt: z.string().min(1),
})

/**
 * POST /api/social/ai/image
 * Self-hosted image gen for Studio Step 2. Returns 1–3 image URLs (square/story/banner). No third-party brand in UI.
 */
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const { prompt } = bodySchema.parse(body)

    if (!isSelfHostedImageAvailable()) {
      return NextResponse.json(
        { error: 'Image generation not configured', hint: 'Set IMAGE_WORKER_URL or TEXT_TO_IMAGE_SERVICE_URL for self-hosted images.' },
        { status: 503 }
      )
    }

    const sizes = ['1024x1024', '1080x1920', '1200x628'] as const
    const images: { id: string; url: string }[] = []

    for (let i = 0; i < sizes.length; i++) {
      const res = await generateSelfHostedImage({
        prompt: prompt.trim(),
        style: 'realistic',
        size: sizes[i],
      })
      if (res?.imageUrl) {
        images.push({ id: `temp-${Date.now()}-${i}`, url: res.imageUrl })
      }
    }

    if (images.length === 0) {
      return NextResponse.json(
        { error: 'No images generated', hint: 'Check IMAGE_WORKER_URL and worker logs.' },
        { status: 502 }
      )
    }

    return NextResponse.json({ images })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    console.error('Social AI image error:', err)
    return NextResponse.json({ error: 'Failed to generate images' }, { status: 500 })
  }
}
