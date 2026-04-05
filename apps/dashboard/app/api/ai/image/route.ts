import { NextRequest, NextResponse } from 'next/server'
import { requireCanonicalAiGatewayAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generateImage, isImageGenerationConfigured } from '@payaid/ai'
import { z } from 'zod'

const bodySchema = z.object({
  prompt: z.string().min(1),
  style: z.enum(['photo', 'illustration']).optional(),
  aspectRatio: z.enum(['1:1', '9:16', '16:9']).optional(),
  strength: z.number().min(0).max(1).optional(),
  sourceImageUrl: z.string().url().optional(),
  workflowPath: z.string().optional(),
})

/**
 * POST /api/ai/image — ComfyUI workflow + IMAGE_WORKER_URL (self-hosted first).
 */
export async function POST(request: NextRequest) {
  try {
    await requireCanonicalAiGatewayAccess(request)
    if (!isImageGenerationConfigured()) {
      return NextResponse.json(
        {
          error: 'Image generation not configured',
          hint: 'Set COMFYUI_URL + COMFYUI_TXT2IMG_WORKFLOW_PATH, or IMAGE_WORKER_URL.',
        },
        { status: 503 }
      )
    }
    const body = await request.json()
    const input = bodySchema.parse(body)
    const { result, meta } = await generateImage({
      prompt: input.prompt,
      style: input.style,
      aspectRatio: input.aspectRatio,
      strength: input.strength,
      sourceImageUrl: input.sourceImageUrl,
      workflowPath: input.workflowPath,
    })
    return NextResponse.json({
      url: result.url,
      width: result.width,
      height: result.height,
      provider: meta.provider,
      revisedPrompt: meta.revisedPrompt,
      generationTimeMs: meta.generationTimeMs,
    })
  } catch (err) {
    if (err && typeof err === 'object' && 'moduleId' in err) return handleLicenseError(err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: err.errors }, { status: 400 })
    }
    console.error('/api/ai/image error:', err)
    const message = err instanceof Error ? err.message : 'Image generation failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
