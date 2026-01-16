import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/locations/[id] - Get a specific location
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const location = await prisma.location.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ location })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get location error:', error)
    return NextResponse.json(
      { error: 'Failed to get location' },
      { status: 500 }
    )
  }
}

// PATCH /api/locations/[id] - Update a location
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const body = await request.json()
    const { name, code, city, state, country, isActive } = body

    const location = await prisma.location.updateMany({
      where: {
        id: params.id,
        tenantId,
      },
      data: {
        ...(name && { name }),
        ...(code !== undefined && { code }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(country && { country }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    if (location.count === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const updatedLocation = await prisma.location.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    return NextResponse.json({ location: updatedLocation })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Update location error:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE /api/locations/[id] - Delete a location
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'inventory')

    const location = await prisma.location.deleteMany({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (location.count === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete location error:', error)
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}

