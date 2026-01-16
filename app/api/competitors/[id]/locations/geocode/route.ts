import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/competitors/[id]/locations/geocode
 * Geocode an address using Google Maps API and add/update location
 */
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
    const { address, name } = body

    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      )
    }

    // Geocode address using Google Maps API
    const apiKey = process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    const response = await fetch(geocodeUrl)
    const data = await response.json()

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'Failed to geocode address' },
        { status: 400 }
      )
    }

    const result = data.results[0]
    const location = result.geometry.location
    const addressComponents = result.address_components

    // Extract address components
    let city = ''
    let state = ''
    let postalCode = ''
    let country = 'India'

    for (const component of addressComponents) {
      if (component.types.includes('locality')) {
        city = component.long_name
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name
      }
      if (component.types.includes('postal_code')) {
        postalCode = component.long_name
      }
      if (component.types.includes('country')) {
        country = component.long_name
      }
    }

    // Check if location already exists
    const existingLocation = await prisma.competitorLocation.findFirst({
      where: {
        competitorId: params.id,
        address,
      },
    })

    let locationRecord
    if (existingLocation) {
      locationRecord = await prisma.competitorLocation.update({
        where: { id: existingLocation.id },
        data: {
          name: name || existingLocation.name,
          city,
          state,
          postalCode,
          country,
          latitude: location.lat,
          longitude: location.lng,
          lastCheckedAt: new Date(),
        },
      })
    } else {
      locationRecord = await prisma.competitorLocation.create({
        data: {
          competitorId: params.id,
          name: name || address,
          address,
          city,
          state,
          postalCode,
          country,
          latitude: location.lat,
          longitude: location.lng,
          discoveredAt: new Date(),
          lastCheckedAt: new Date(),
        },
      })

      // Create alert for new location
      await prisma.competitorAlert.create({
        data: {
          competitorId: params.id,
          type: 'NEW_LOCATION',
          title: `New Location Discovered: ${locationRecord.name}`,
          message: `${competitor.name} has a location at ${address}`,
          severity: 'INFO',
          metadata: {
            locationName: locationRecord.name,
            address,
            city,
            state,
            latitude: location.lat,
            longitude: location.lng,
          },
        },
      })
    }

    return NextResponse.json({ location: locationRecord })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Geocode location error:', error)
    return NextResponse.json(
      { error: 'Failed to geocode address' },
      { status: 500 }
    )
  }
}

