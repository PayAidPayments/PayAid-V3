import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

// POST /api/logos/[id]/set-workspace - set selected logo as workspace logo
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

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { logo: selectedVariation.imageUrl },
    })

    return NextResponse.json({
      success: true,
      logoId: logo.id,
      workspaceLogoUrl: selectedVariation.imageUrl,
    })
  } catch (error) {
    console.error('Set workspace logo error:', error)
    return NextResponse.json({ error: 'Failed to set workspace logo' }, { status: 500 })
  }
}

