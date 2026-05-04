import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/logos/[id] - Get single logo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const logo = await prisma.logo.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        variations: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!logo) {
      return NextResponse.json(
        { error: 'Logo not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(logo)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get logo error:', error)
    return NextResponse.json(
      { error: 'Failed to get logo' },
      { status: 500 }
    )
  }
}

// DELETE /api/logos/[id] - Delete logo and related variations
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const deleted = await prisma.logo.deleteMany({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete logo error:', error)
    return NextResponse.json(
      { error: 'Failed to delete logo' },
      { status: 500 }
    )
  }
}
