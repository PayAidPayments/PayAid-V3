import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

// GET /api/competitors/[id]/locations - Get competitor locations
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const locations = await prisma.competitorLocation.findMany({
      where: { competitorId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ locations })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get competitor locations error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST /api/competitors/[id]/locations - Add competitor location
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')

    const competitor = await prisma.competitor.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!competitor) {
      return NextResponse.json(
        { error: 'Competitor not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, address, city, state, postalCode, country, latitude, longitude, phone, email } = body

    if (!name || !address) {
      return NextResponse.json(
        { error: 'Location name and address are required' },
        { status: 400 }
      )
    }

    // Check if location already exists (by address)
    const existingLocation = await prisma.competitorLocation.findFirst({
      where: {
        competitorId: params.id,
        address,
      },
    })

    let location
    if (existingLocation) {
      // Update existing location
      location = await prisma.competitorLocation.update({
        where: { id: existingLocation.id },
        data: {
          name,
          city,
          state,
          postalCode,
          country: country || 'India',
          latitude: latitude ? parseFloat(latitude.toString()) : null,
          longitude: longitude ? parseFloat(longitude.toString()) : null,
          phone,
          email,
          lastCheckedAt: new Date(),
        },
      })
    } else {
      // Create new location
      location = await prisma.competitorLocation.create({
        data: {
          competitorId: params.id,
          name,
          address,
          city,
          state,
          postalCode,
          country: country || 'India',
          latitude: latitude ? parseFloat(latitude.toString()) : null,
          longitude: longitude ? parseFloat(longitude.toString()) : null,
          phone,
          email,
          discoveredAt: new Date(),
          lastCheckedAt: new Date(),
        },
      })

      // Create alert for new location
      await prisma.competitorAlert.create({
        data: {
          competitorId: params.id,
          type: 'NEW_LOCATION',
          title: `New Location Discovered: ${name}`,
          message: `${competitor.name} opened a new location at ${address}`,
          severity: 'INFO',
          metadata: {
            locationName: name,
            address,
            city,
            state,
          },
        },
      })
    }

    return NextResponse.json({ location }, { status: existingLocation ? 200 : 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Add competitor location error:', error)
    return NextResponse.json(
      { error: 'Failed to add location' },
      { status: 500 }
    )
  }
}

