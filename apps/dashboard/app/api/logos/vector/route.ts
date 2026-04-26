import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { vectorLogoEngine, type LogoConfig } from '@/lib/logo/vector-engine'
import { ensureLogoSchemaCompatibility } from '@/lib/logo/ensure-logo-schema'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const vectorLogoSchema = z.object({
  businessName: z.string().min(1).max(100),
  industry: z.string().optional(),
  style: z.string().optional(),
  fontFamily: z.string().min(1),
  fontSize: z.number().min(12).max(200),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  iconStyle: z.enum(['none', 'circle-monogram', 'diamond', 'spark', 'shield', 'hex']).optional(),
  iconColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  gradient: z.object({
    type: z.enum(['linear', 'radial']),
    colors: z.array(z.string()),
    angle: z.number().optional(),
  }).optional(),
  shadow: z.object({
    x: z.number(),
    y: z.number(),
    blur: z.number(),
    color: z.string(),
  }).optional(),
  outline: z.object({
    width: z.number(),
    color: z.string(),
  }).optional(),
  animation: z.enum(['none', 'pulse', 'bounce', 'glitch', 'rotate', 'shake', 'glow']).optional(),
  background: z.object({
    type: z.enum(['color', 'pattern', 'transparent']),
    value: z.string(),
  }).optional(),
  layout: z.object({
    align: z.enum(['left', 'center', 'right']),
    offsetX: z.number(),
    offsetY: z.number(),
    rotation: z.number(),
  }).optional(),
  saveToBrandKit: z.boolean().optional(),
  setAsBrandLogo: z.boolean().optional(),
})

/**
 * POST /api/logos/vector
 * Generate a vector logo with SVG export
 */
export async function POST(request: NextRequest) {
  try {
    // Check AI Studio module license
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    await ensureLogoSchemaCompatibility()

    const body = await request.json()
    const validated = vectorLogoSchema.parse(body)

    console.log(`[Vector Logo] Generating logo for business: ${validated.businessName}`)

    // Build logo configuration
    const logoConfig: LogoConfig = {
      text: validated.businessName,
      fontFamily: validated.fontFamily,
      fontSize: validated.fontSize,
      color: validated.color,
      iconStyle: validated.iconStyle || 'circle-monogram',
      iconColor: validated.iconColor || validated.color,
      gradient: validated.gradient,
      shadow: validated.shadow,
      outline: validated.outline,
      animation: validated.animation || 'none',
      background: validated.background || { type: 'transparent', value: '' },
      layout: validated.layout || {
        align: 'center',
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
      },
    }

    // Generate SVG
    console.log('[Vector Logo] Generating SVG...')
    let svgData = await vectorLogoEngine.generateSVG(logoConfig)
    
    // Embed font data into SVG
    console.log('[Vector Logo] Embedding font data...')
    svgData = await vectorLogoEngine.embedFontInSVG(svgData, validated.fontFamily)

    // For now, we'll generate a data URL for the PNG preview
    // In production, this should be done client-side or via a proper image service
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgData).toString('base64')}`

    // Create logo record in database
    console.log('[Vector Logo] Saving to database...')
    const logo = await prisma.logo.create({
      data: {
        businessName: validated.businessName,
        industry: validated.industry,
        style: validated.style,
        colors: validated.gradient?.colors || [validated.color],
        prompt:
          validated.style?.trim() ||
          `${validated.businessName} vector logo (${validated.iconStyle || 'circle-monogram'})`,
        logoType: 'VECTOR',
        status: 'COMPLETED',
        tenantId,
        variations: {
          create: {
            imageUrl: svgDataUrl, // SVG as data URL for now
            thumbnailUrl: svgDataUrl,
            svgData,
            fontFamily: validated.fontFamily,
            fontSize: validated.fontSize,
            textColor: validated.color,
            gradient: validated.gradient as any,
            shadow: validated.shadow as any,
            outline: validated.outline as any,
            animation: validated.animation || 'none',
            background: validated.background as any,
            layout: validated.layout as any,
            layoutConfig: logoConfig as any,
            isSelected: true,
            tenantId,
          },
        },
      },
      include: {
        variations: true,
      },
    })

    let brandKitAssetId: string | null = null
    if (validated.saveToBrandKit ?? true) {
      const asset = await prisma.mediaLibrary.create({
        data: {
          tenantId,
          fileName: `${validated.businessName.replace(/\s+/g, '-').toLowerCase()}-vector-logo.svg`,
          fileUrl: logo.variations[0]?.imageUrl || '',
          fileSize: Math.max(1, Math.floor(Buffer.byteLength(svgData, 'utf8'))),
          mimeType: 'image/svg+xml',
          title: `${validated.businessName} Logo`,
          description: 'Vector logo saved from Logo Generator',
          tags: ['brand-kit', 'logo', 'vector'],
          category: 'BRAND_KIT_LOGO',
          source: 'LOGO_GENERATOR_VECTOR',
          originalPrompt: validated.style || 'vector-logo',
          uploadedById: null,
        },
      })
      brandKitAssetId = asset.id
    }

    if (validated.setAsBrandLogo && logo.variations[0]?.imageUrl) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          logo: logo.variations[0].imageUrl,
        },
      })
    }

    console.log(`[Vector Logo] Logo created successfully: ${logo.id}`)

    return NextResponse.json(
      {
        logo,
        brandKitAssetId,
        svg: svgData,
        message: 'Vector logo generated successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Vector Logo] Generation error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to generate vector logo',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/logos/vector
 * List all vector logos for the tenant
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    await ensureLogoSchemaCompatibility()

    const logos = await prisma.logo.findMany({
      where: {
        tenantId,
        logoType: 'VECTOR',
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

    return NextResponse.json({ logos })
  } catch (error) {
    console.error('[Vector Logo] List error:', error)
    return NextResponse.json(
      { error: 'Failed to list vector logos' },
      { status: 500 }
    )
  }
}
