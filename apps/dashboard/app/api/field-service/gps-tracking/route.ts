import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateLocationSchema = z.object({
  workOrderId: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timestamp: z.string().datetime().optional(),
})

/**
 * POST /api/field-service/gps-tracking
 * Update GPS location for work order
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'field-service')

    const body = await request.json()
    const validated = updateLocationSchema.parse(body)

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: validated.workOrderId,
        tenantId,
      },
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      )
    }

    // Update work order location
    await prisma.workOrder.update({
      where: { id: validated.workOrderId },
      data: {
        latitude: validated.latitude,
        longitude: validated.longitude,
      },
    })

    // Create service history record for tracking
    await prisma.serviceHistory.create({
      data: {
        workOrderId: validated.workOrderId,
        serviceDate: validated.timestamp ? new Date(validated.timestamp) : new Date(),
        serviceType: 'GPS_TRACKING',
        description: `Location updated: ${validated.latitude}, ${validated.longitude}`,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Location updated',
      location: {
        latitude: validated.latitude,
        longitude: validated.longitude,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('GPS tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/field-service/gps-tracking
 * Get GPS locations for work orders
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'field-service')

    const { searchParams } = new URL(request.url)
    const workOrderId = searchParams.get('workOrderId')
    const technicianId = searchParams.get('technicianId')
    const status = searchParams.get('status') || 'IN_PROGRESS'

    const where: any = {
      tenantId,
      status,
      latitude: { not: null },
      longitude: { not: null },
    }

    if (workOrderId) where.id = workOrderId
    if (technicianId) where.technicianId = technicianId

    const workOrders = await prisma.workOrder.findMany({
      where,
      select: {
        id: true,
        workOrderNumber: true,
        status: true,
        latitude: true,
        longitude: true,
        scheduledDate: true,
        technician: {
          select: {
            id: true,
            name: true,
          },
        },
        contact: {
          select: {
            name: true,
            address: true,
          },
        },
      },
    })

    return NextResponse.json({
      locations: workOrders.map((wo) => ({
        workOrderId: wo.id,
        workOrderNumber: wo.workOrderNumber,
        latitude: wo.latitude,
        longitude: wo.longitude,
        status: wo.status,
        technician: wo.technician,
        customer: wo.contact,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get GPS tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GPS locations' },
      { status: 500 }
    )
  }
}

