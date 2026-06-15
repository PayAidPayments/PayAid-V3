import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import {
  imageParamsHash,
  getImageDailyLimit,
  getTodayImageCount,
  getLimitResetAt,
  isPromptBlocked,
  getBrandGuidelines,
  getCachedImageUrl,
  setCachedImage,
  logImageGeneration,
  recordPromptHistory,
} from '@/lib/ai/image-studio'
import { z } from 'zod'

const generateSchema = z.object({
  prompt: z.string().min(1),
  negativePrompt: z.string().optional(),
  style: z.string().optional(),
  size: z.string().optional(),
  provider: z.string().optional(),
})

/**
 * POST /api/ai/image/generate
 * Wraps image generation with cache, rate limits, blocklist, and brand guidelines.
 * Forwards to existing /api/ai/generate-image after checks.
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    const body = await request.json()
    const validated = generateSchema.parse(body)

    const promptTrimmed = validated.prompt.trim()
    if (!promptTrimmed) {
      return NextResponse.json(
        { error: 'Validation error', message: 'prompt is required' },
        { status: 400 }
      )
    }

    // Blocklist check
    const blocked = await isPromptBlocked(tenantId, promptTrimmed)
    if (blocked) {
      return NextResponse.json(
        {
          error: 'Prompt not allowed',
          message: 'Your prompt contains content that is not allowed by your organization.',
        },
        { status: 400 }
      )
    }

    // Rate limit check
    const [limit, used] = await Promise.all([
      getImageDailyLimit(tenantId),
      getTodayImageCount(tenantId),
    ])
    const remaining = Math.max(0, limit - used)
    if (remaining <= 0) {
      const resetAt = getLimitResetAt()
      const res = NextResponse.json(
        {
          error: 'Daily limit reached',
          message: `You have reached the daily image generation limit (${limit}). Resets at ${resetAt.toISOString()}.`,
          limit,
          used,
          resetAt: resetAt.toISOString(),
        },
        { status: 429 }
      )
      res.headers.set('X-Remaining-Images-Today', '0')
      res.headers.set('X-Limit-Reset', resetAt.toISOString())
      return res
    }

    // Append brand guidelines to prompt
    const brandSuffix = await getBrandGuidelines(tenantId)
    const promptWithBrand = brandSuffix ? `${promptTrimmed}${brandSuffix}` : promptTrimmed

    // Cache key (same params => return cached URL)
    const paramsHash = imageParamsHash({
      prompt: promptWithBrand,
      negativePrompt: validated.negativePrompt,
      style: validated.style,
      size: validated.size,
    })
    const cachedUrl = await getCachedImageUrl(tenantId, paramsHash)
    if (cachedUrl) {
      await Promise.all([
        logImageGeneration({
          tenantId,
          userId,
          prompt: promptTrimmed,
          params: { style: validated.style, size: validated.size },
          imageUrl: cachedUrl,
          cached: true,
        }),
        recordPromptHistory({ tenantId, userId, prompt: promptTrimmed }),
      ])
      const res = NextResponse.json({
        imageUrl: cachedUrl,
        revisedPrompt: promptWithBrand,
        cached: true,
      })
      res.headers.set('X-Remaining-Images-Today', String(remaining - 1))
      res.headers.set('X-Limit-Reset', getLimitResetAt().toISOString())
      return res
    }

    // Call existing generate-image API (same auth)
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const authHeader = request.headers.get('authorization') || ''
    const genRes = await fetch(`${baseUrl}/api/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        prompt: promptWithBrand,
        style: validated.style,
        size: validated.size,
        provider: validated.provider || 'auto',
      }),
    })

    if (!genRes.ok) {
      const errData = await genRes.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: errData.error || 'Image generation failed',
          message: errData.message || errData.hint || `API returned ${genRes.status}`,
          hint: errData.hint,
        },
        { status: genRes.status }
      )
    }

    const data = await genRes.json()
    const imageUrl = data.imageUrl || data.url
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'No image URL', message: 'Generation succeeded but no image URL was returned.' },
        { status: 500 }
      )
    }

    // Cache and log (only cache stable URLs, not data URLs if we want to avoid huge DB storage)
    const shouldCache = imageUrl.startsWith('http') && !imageUrl.startsWith('data:')
    if (shouldCache) {
      await setCachedImage(tenantId, paramsHash, imageUrl)
    }
    await logImageGeneration({
      tenantId,
      userId,
      prompt: promptTrimmed,
      params: { style: validated.style, size: validated.size },
      imageUrl,
      cached: false,
    })
    await recordPromptHistory({ tenantId, userId, prompt: promptTrimmed })

    const newRemaining = Math.max(0, remaining - 1)
    const res = NextResponse.json({
      imageUrl,
      revisedPrompt: data.revisedPrompt ?? promptWithBrand,
      service: data.service,
      cached: false,
    })
    res.headers.set('X-Remaining-Images-Today', String(newRemaining))
    res.headers.set('X-Limit-Reset', getLimitResetAt().toISOString())
    res.headers.set('X-Image-Daily-Limit', String(limit))
    return res
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: err.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(err)
  }
}
