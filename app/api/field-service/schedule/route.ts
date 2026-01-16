import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const scheduleWorkOrderSchema = z.object({
  workOrderId: z.string(),
  technicianId: z.string(),
  scheduledDate: z.string().datetime(),
  scheduledTime: z.string(),
})

/**
 * POST /api/field-service/schedule
 * Schedule work order for technician
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'field-service')

    const body = await request.json()
    const validated = scheduleWorkOrderSchema.parse(body)

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

    // Check technician availability (simple check - can be enhanced)
    const conflictingOrders = await prisma.workOrder.count({
      where: {
        tenantId,
        technicianId: validated.technicianId,
        scheduledDate: new Date(validated.scheduledDate),
        scheduledTime: validated.scheduledTime,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        id: { not: validated.workOrderId },
      },
    })

    if (conflictingOrders > 0) {
      return NextResponse.json(
        { error: 'Technician already has a work order scheduled at this time' },
        { status: 400 }
      )
    }

    const updated = await prisma.workOrder.update({
      where: { id: validated.workOrderId },
      data: {
        technicianId: validated.technicianId,
        scheduledDate: new Date(validated.scheduledDate),
        scheduledTime: validated.scheduledTime,
        status: 'SCHEDULED',
      },
      include: {
        technician: true,
      },
    })

    return NextResponse.json({
      workOrder: updated,
      message: 'Work order scheduled successfully',
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

    console.error('Schedule work order error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule work order' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/field-service/schedule
 * Get schedule for technicians
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'field-service')

    const { searchParams } = new URL(request.url)
    const technicianId = searchParams.get('technicianId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      tenantId,
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    }

    if (technicianId) where.technicianId = technicianId
    if (startDate || endDate) {
      where.scheduledDate = {}
      if (startDate) where.scheduledDate.gte = new Date(startDate)
      if (endDate) where.scheduledDate.lte = new Date(endDate)
    }

    const schedule = await prisma.workOrder.findMany({
      where,
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        contact: {
          select: {
            name: true,
            phone: true,
            address: true,
          },
        },
      },
      orderBy: [
        { scheduledDate: 'asc' },
        { scheduledTime: 'asc' },
      ],
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch schedule' },
      { status: 500 }
    )
  }
}

