import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

// POST /api/logos/[id]/save-brand-kit - save selected variation as brand-kit asset
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const logo = await prisma.logo.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
      include: {
        variations: {
          where: { isSelected: true },
          take: 1,
        },
      },
    })

    if (!logo) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
    }

    const selectedVariation = logo.variations[0]
    if (!selectedVariation?.imageUrl) {
      return NextResponse.json({ error: 'No selected variation found for this logo' }, { status: 400 })
    }

    const lockupType =
      ((selectedVariation.layoutConfig as Record<string, unknown> | null)?.layout as Record<string, unknown> | undefined)
        ?.lockupType || 'combination-horizontal'

    const fileExt = selectedVariation.svgData ? 'svg' : 'png'
    const safeName = logo.businessName.trim().toLowerCase().replace(/[^\w-]+/g, '-')
    const fileName = `${safeName || 'logo'}-${lockupType}.${fileExt}`

    const asset = await prisma.mediaLibrary.create({
      data: {
        tenantId,
        fileName,
        fileUrl: selectedVariation.imageUrl,
        fileSize: Math.max(
          1,
          selectedVariation.svgData ? Buffer.byteLength(selectedVariation.svgData, 'utf8') : 1024
        ),
        mimeType: selectedVariation.svgData ? 'image/svg+xml' : 'image/png',
        title: `${logo.businessName} (${String(lockupType)})`,
        description: `Saved from logo detail (${logo.logoType || 'VECTOR'})`,
        tags: ['brand-kit', 'logo', String(lockupType)],
        category: 'BRAND_KIT_LOGO',
        source: 'LOGO_DETAIL',
        originalPrompt: logo.prompt || 'logo-detail-save',
        uploadedById: null,
      },
    })

    return NextResponse.json({
      success: true,
      logoId: logo.id,
      mediaLibraryId: asset.id,
    })
  } catch (error) {
    console.error('Save brand kit logo error:', error)
    return NextResponse.json({ error: 'Failed to save logo into brand kit' }, { status: 500 })
  }
}

