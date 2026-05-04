import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { logoGenerationRequestSchema } from '@/lib/ai/generation/contracts'
import { normalizeImageProvider } from '@/lib/ai/generation/provider-plan'
import { z } from 'zod'

/**
 * POST /api/ai/logo/generate
 * Layer 2: logo concept generation (separate from generic image generation).
 * Returns concept image plus vector-first follow-up guidance.
 */
export async function POST(request: NextRequest) {
  try {
    try {
      await requireModuleAccess(request, 'ai-studio')
    } catch (accessError) {
      if (accessError && typeof accessError === 'object' && 'moduleId' in accessError) {
        await requireModuleAccess(request, 'marketing')
      } else {
        throw accessError
      }
    }

    const body = await request.json()
    const input = logoGenerationRequestSchema.parse(body)
    const provider = normalizeImageProvider(input.provider)

    const parts = [
      `Design a professional, clean logo concept for "${input.brandName}".`,
      input.tagline ? `Tagline context: ${input.tagline}.` : null,
      input.visualDirection ? `Visual direction: ${input.visualDirection}.` : null,
      input.colorPalette ? `Preferred colors: ${input.colorPalette}.` : null,
      'Output should be brandable, minimal, high-contrast, and avoid tiny illegible text.',
    ].filter(Boolean)
    const prompt = parts.join(' ')

    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const authHeader = request.headers.get('authorization') || ''
    const genRes = await fetch(`${baseUrl}/api/ai/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify({
        prompt,
        style: 'illustration',
        size: '1024x1024',
        provider,
      }),
    })

    const data = await genRes.json().catch(() => ({}))
    if (!genRes.ok) {
      return NextResponse.json(
        {
          error: data.error || 'Logo concept generation failed',
          message: data.message || data.hint || `API returned ${genRes.status}`,
          hint: data.hint,
        },
        { status: genRes.status }
      )
    }

    return NextResponse.json({
      logoConceptImageUrl: data.imageUrl || data.url || null,
      revisedPrompt: data.revisedPrompt || prompt,
      service: data.service || null,
      guidance: {
        nextStep:
          'Treat this as concept-only. Final logo delivery should be vector-first (SVG), editable, and exported as a brand kit.',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    return handleLicenseError(err)
  }
}
