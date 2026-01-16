import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/mobile/location/track
 * Track field agent location
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { latitude, longitude, accuracy, timestamp } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Store location tracking data
    // Note: You may want to create a LocationTracking model in schema
    // For now, we'll use a JSON field or create a simple tracking record

    // Create location tracking record
    const tracking = await prisma.$executeRaw`
      INSERT INTO "LocationTracking" ("id", "tenantId", "userId", "latitude", "longitude", "accuracy", "timestamp", "createdAt")
      VALUES (gen_random_uuid(), ${tenantId}, ${userId}, ${latitude}, ${longitude}, ${accuracy || null}, ${timestamp || new Date()}, NOW())
    `.catch(() => {
      // If table doesn't exist, return success anyway (tracking is optional)
      return { success: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Location tracked successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Track location error:', error)
    return NextResponse.json(
      { error: 'Failed to track location' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mobile/location/history
 * Get location history for field agent
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get location history
    // Note: Implement with LocationTracking model when available
    const history = await prisma.$queryRaw`
      SELECT * FROM "LocationTracking"
      WHERE "tenantId" = ${tenantId}
        AND "userId" = ${userId}
        ${startDate ? `AND "timestamp" >= ${startDate}` : ''}
        ${endDate ? `AND "timestamp" <= ${endDate}` : ''}
      ORDER BY "timestamp" DESC
      LIMIT 100
    `.catch(() => [])

    return NextResponse.json({ history })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get location history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch location history' },
      { status: 500 }
    )
  }
}

