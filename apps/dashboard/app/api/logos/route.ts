import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { ensureLogoSchemaCompatibility } from '@/lib/logo/ensure-logo-schema'
import { z } from 'zod'
import { generateImage, ImageGenerationFailed } from '@/lib/ai/image-generation'

const API_BUILD_REF =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
  process.env.NEXT_PUBLIC_BUILD_SHA ||
  'unknown'

const createLogoSchema = z.object({
  businessName: z.string().min(1),
  industry: z.string().optional(),
  style: z.enum(['modern', 'traditional', 'playful', 'elegant', 'minimal', 'bold']).optional(),
  colors: z.array(z.string()).optional(),
})

function buildLogoImagePrompt(input: {
  businessName: string
  industry?: string
  colors?: string[]
  /** Each variation uses a different style keyword for diversity. */
  variationStyle: string
}): string {
  const palette =
    input.colors && input.colors.length > 0
      ? `Primary palette: ${input.colors.join(', ')}.`
      : 'Use a tight 2–3 color palette suitable for print and screens.'
  const sector = input.industry
    ? `Industry: ${input.industry} — let the mark hint at the sector without generic clipart.`
    : ''

  return [
    `Single centered company LOGO for "${input.businessName}".`,
    `Visual direction: ${input.variationStyle} — distinctive, brandable, not generic.`,
    sector,
    palette,
    'Flat 2D vector-style mark, strong silhouette, generous negative space, transparent background only (no scene, no mockup, no frame).',
    'Avoid: photos, 3D renders, watermarks, busy textures, multiple unrelated icons, decorative borders, paragraphs of text.',
    'Prefer: one memorable symbol or clean wordmark; if letters appear they must be short and legible.',
  ]
    .filter(Boolean)
    .join(' ')
}

type GeneratedVariationResult = {
  variation: any
  usedFallback: boolean
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildFallbackLogoSvg(args: {
  businessName: string
  variationStyle: string
  colors?: string[]
}): string {
  const palette = args.colors && args.colors.length > 0 ? args.colors : ['#0f172a', '#2563eb', '#14b8a6']
  const [c1, c2, c3] = [palette[0] || '#0f172a', palette[1] || '#2563eb', palette[2] || '#14b8a6']
  const initial = (args.businessName.trim().charAt(0) || 'A').toUpperCase()
  const title = escapeXml(args.businessName.trim() || 'Brand')
  const subtitle = escapeXml(`${args.variationStyle} concept`)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024" role="img" aria-label="${title} logo">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c3}" />
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="14" stdDeviation="24" flood-color="rgba(2,6,23,0.28)"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="1024" height="1024" fill="#f8fafc"/>
  <g filter="url(#soft)">
    <rect x="152" y="164" width="720" height="560" rx="96" fill="url(#bg)"/>
  </g>
  <circle cx="512" cy="418" r="146" fill="rgba(255,255,255,0.16)" />
  <text x="512" y="456" text-anchor="middle" fill="#ffffff" font-size="160" font-weight="700" font-family="Inter, Poppins, Arial, sans-serif">${escapeXml(initial)}</text>
  <text x="512" y="816" text-anchor="middle" fill="#0f172a" font-size="76" font-weight="700" font-family="Inter, Poppins, Arial, sans-serif">${title}</text>
  <text x="512" y="872" text-anchor="middle" fill="#334155" font-size="34" font-weight="500" font-family="Inter, Poppins, Arial, sans-serif">${subtitle}</text>
</svg>`
}

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`
}

// GET /api/logos - List all logos
export async function GET(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    await ensureLogoSchemaCompatibility()

    const logos = await prisma.logo.findMany({
      where: {
        tenantId: tenantId,
      },
      include: {
        variations: {
          where: { isSelected: true },
          take: 1,
        },
        _count: {
          select: { variations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      { logos, buildRef: API_BUILD_REF },
      { headers: { 'x-payaid-build-ref': API_BUILD_REF } }
    )
  } catch (error) {
    console.error('Get logos error:', error)
    return NextResponse.json(
      { error: 'Failed to get logos', buildRef: API_BUILD_REF },
      { status: 500, headers: { 'x-payaid-build-ref': API_BUILD_REF } }
    )
  }
}

// POST /api/logos - Generate logo
export async function POST(request: NextRequest) {
  try {
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    await ensureLogoSchemaCompatibility()

    // Get token from request headers for passing to image generation
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || undefined

    const body = await request.json()
    const validated = createLogoSchema.parse(body)

    const baseStyle = validated.style || 'modern'
    const promptSummary = buildLogoImagePrompt({
      businessName: validated.businessName,
      industry: validated.industry,
      colors: validated.colors,
      variationStyle: baseStyle,
    })

    // Create logo record
    const logo = await prisma.logo.create({
      data: {
        businessName: validated.businessName,
        industry: validated.industry,
        style: validated.style,
        colors: validated.colors || [],
        prompt: promptSummary,
        logoType: 'AI_IMAGE',
        status: 'GENERATING',
        tenantId: tenantId,
      },
    })

    // Five variations with distinct aesthetic keywords (dedupe when user picks a style already in the pool)
    const variationStyles = Array.from(
      new Set([
        validated.style || 'modern',
        'traditional',
        'playful',
        'elegant',
        'minimal',
        'bold',
      ])
    ).slice(0, 5)

    try {
      const variationResults = await Promise.all(
        variationStyles.map((variationStyle) =>
          generateLogoVariation(
            logo.id,
            {
              businessName: validated.businessName,
              industry: validated.industry,
              colors: validated.colors,
              variationStyle,
            },
            tenantId,
            token
          )
        )
      )
      const variations = variationResults.map((r) => r.variation)
      const fallbackCount = variationResults.filter((r) => r.usedFallback).length

      // Update logo status
      await prisma.logo.update({
        where: { id: logo.id },
        data: {
          status: 'COMPLETED',
          modelUsed: fallbackCount > 0 ? 'stable-diffusion+fallback' : 'stable-diffusion',
        },
      })

      return NextResponse.json({
        ...logo,
        status: 'COMPLETED',
        buildRef: API_BUILD_REF,
        variations,
        ...(fallbackCount > 0
          ? {
              warning:
                'Some variations were generated using local fallback SVG because an external image provider is not configured or failed.',
              fallbackCount,
            }
          : {}),
      }, { status: 201, headers: { 'x-payaid-build-ref': API_BUILD_REF } })
    } catch (error) {
      // Update logo status to failed
      await prisma.logo.update({
        where: { id: logo.id },
        data: { status: 'FAILED' },
      })

      // Log detailed error for debugging
      console.error('Logo generation failed:', error)
      if (error instanceof Error) {
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
      }

      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', buildRef: API_BUILD_REF, details: error.errors },
        { status: 400, headers: { 'x-payaid-build-ref': API_BUILD_REF } }
      )
    }

    console.error('Generate logo error:', error)

    const diagnosticsId = `logo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    console.error(`Logo generation diagnostics id=${diagnosticsId}`)

    if (error instanceof ImageGenerationFailed) {
      const httpStatus = error.statusCode >= 400 && error.statusCode < 600 ? error.statusCode : 503
      return NextResponse.json(
        {
          error: 'Unable to generate logo right now.',
          hint: error.message,
          setupInstructions: error.remoteBody?.setupInstructions,
          diagnosticsId,
          buildRef: API_BUILD_REF,
        },
        { status: httpStatus, headers: { 'x-payaid-build-ref': API_BUILD_REF } }
      )
    }

    let hint = 'Please try again in a moment.'
    if (error instanceof Error) {
      if (error.message) {
        hint = error.message
      }
      if (error.message.includes('Unauthorized') || error.message.includes('401')) {
        hint = 'Your session expired. Please sign in again and retry.'
      } else if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        hint = 'Image generation took too long. Please retry.'
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        hint = 'Network issue detected while generating your logo.'
      }
    }

    return NextResponse.json(
      {
        error: 'Unable to generate logo right now.',
        hint,
        diagnosticsId,
        buildRef: API_BUILD_REF,
      },
      { status: 500, headers: { 'x-payaid-build-ref': API_BUILD_REF } }
    )
  }
}

async function generateLogoVariation(
  logoId: string,
  args: {
    businessName: string
    industry?: string
    colors?: string[]
    variationStyle: string
  },
  tenantId: string,
  token?: string
) : Promise<GeneratedVariationResult> {
  try {
    const prompt = buildLogoImagePrompt(args)

    console.log(`Generating logo variation: ${args.variationStyle} style for logo ${logoId}`)

    // Generate image using existing image generation API
    const imageResult = await generateImage({
      prompt,
      size: '1024x1024',
      tenantId,
      token,
    })
    
    if (!imageResult.url) {
      throw new Error('Image generation returned empty URL')
    }
    
    console.log(`Logo variation generated successfully: ${imageResult.url.substring(0, 50)}...`)
    
    // Create variation record
    const variation = await prisma.logoVariation.create({
      data: {
        logoId,
        imageUrl: imageResult.url,
        thumbnailUrl: imageResult.url, // Use same URL for thumbnail (can optimize later)
        iconStyle: args.variationStyle,
        tenantId,
      },
    })

    return { variation, usedFallback: false }
  } catch (error) {
    console.error(`Failed to generate logo variation (${args.variationStyle}), using fallback SVG:`, error)

    const fallbackSvg = buildFallbackLogoSvg({
      businessName: args.businessName,
      variationStyle: args.variationStyle,
      colors: args.colors,
    })
    const fallbackDataUrl = svgToDataUrl(fallbackSvg)

    const variation = await prisma.logoVariation.create({
      data: {
        logoId,
        imageUrl: fallbackDataUrl,
        thumbnailUrl: fallbackDataUrl,
        svgData: fallbackSvg,
        iconStyle: `${args.variationStyle}-fallback`,
        tenantId,
      },
    })

    return { variation, usedFallback: true }
  }
}

