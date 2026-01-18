import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateWorkOrderSchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  technicianId: z.string().optional(),
  scheduledDate: z.string().datetime().optional(),
  scheduledTime: z.string().optional(),
  actualStartDate: z.string().datetime().optional(),
  actualEndDate: z.string().datetime().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  technicianNotes: z.string().optional(),
  customerNotes: z.string().optional(),
  totalCost: z.number().positive().optional(),
})

/**
 * GET /api/field-service/work-orders/[id]
 * Get work order details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'field-service')

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        contact: true,
        technician: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        serviceHistoryRecords: {
          orderBy: { serviceDate: 'desc' },
        },
      },
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ workOrder })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get work order error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch work order' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/field-service/work-orders/[id]
 * Update work order
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'field-service')

    const body = await request.json()
    const validated = updateWorkOrderSchema.parse(body)

    const workOrder = await prisma.workOrder.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!workOrder) {
      return NextResponse.json(
        { error: 'Work order not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validated.status) updateData.status = validated.status
    if (validated.technicianId) updateData.technicianId = validated.technicianId
    if (validated.scheduledDate) updateData.scheduledDate = new Date(validated.scheduledDate)
    if (validated.scheduledTime) updateData.scheduledTime = validated.scheduledTime
    if (validated.actualStartDate) updateData.actualStartDate = new Date(validated.actualStartDate)
    if (validated.actualEndDate) updateData.actualEndDate = new Date(validated.actualEndDate)
    if (validated.latitude !== undefined) updateData.latitude = validated.latitude
    if (validated.longitude !== undefined) updateData.longitude = validated.longitude
    if (validated.technicianNotes) updateData.technicianNotes = validated.technicianNotes
    if (validated.customerNotes) updateData.customerNotes = validated.customerNotes
    if (validated.totalCost) updateData.totalCost = validated.totalCost

    // Calculate duration if both dates are provided
    if (updateData.actualStartDate && updateData.actualEndDate) {
      const start = new Date(updateData.actualStartDate)
      const end = new Date(updateData.actualEndDate)
      updateData.actualDuration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)) // minutes
    }

    const updated = await prisma.workOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        contact: true,
        technician: true,
      },
    })

    return NextResponse.json({ workOrder: updated })
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

    console.error('Update work order error:', error)
    return NextResponse.json(
      { error: 'Failed to update work order' },
      { status: 500 }
    )
  }
}

