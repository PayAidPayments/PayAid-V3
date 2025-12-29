import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateScheduleSchema = z.object({
  scheduledStartDate: z.string().datetime().optional(),
  scheduledEndDate: z.string().datetime().optional(),
  actualStartDate: z.string().datetime().optional().nullable(),
  actualEndDate: z.string().datetime().optional().nullable(),
  machineId: z.string().optional().nullable(),
  machineName: z.string().optional().nullable(),
  assignedWorkers: z.array(z.string()).optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  notes: z.string().optional(),
})

// GET /api/industries/manufacturing/schedules/[id] - Get schedule details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const schedule = await prisma.productionSchedules.findUnique({
      where: {
        id,
        tenantId,
      },
      include: {
        order: {
          include: {
            materials: true,
          },
        },
      },
    })

    if (!schedule) {
      return NextResponse.json(
        { error: 'Production schedule not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ schedule })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to get production schedule' },
      { status: 500 }
    )
  }
}

// PUT /api/industries/manufacturing/schedules/[id] - Update schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const body = await request.json()
    const validated = updateScheduleSchema.parse(body)

    const updateData: any = {}
    if (validated.scheduledStartDate) updateData.scheduledStartDate = new Date(validated.scheduledStartDate)
    if (validated.scheduledEndDate) updateData.scheduledEndDate = new Date(validated.scheduledEndDate)
    if (validated.actualStartDate !== undefined) {
      updateData.actualStartDate = validated.actualStartDate ? new Date(validated.actualStartDate) : null
    }
    if (validated.actualEndDate !== undefined) {
      updateData.actualEndDate = validated.actualEndDate ? new Date(validated.actualEndDate) : null
    }
    if (validated.machineId !== undefined) updateData.machineId = validated.machineId
    if (validated.machineName !== undefined) updateData.machineName = validated.machineName
    if (validated.assignedWorkers !== undefined) updateData.assignedWorkers = validated.assignedWorkers
    if (validated.status) updateData.status = validated.status
    if (validated.priority) updateData.priority = validated.priority
    if (validated.notes !== undefined) updateData.notes = validated.notes

    const schedule = await prisma.productionSchedules.update({
      where: {
        id,
        tenantId,
      },
      data: updateData,
      include: {
        order: true,
      },
    })

    return NextResponse.json({ schedule })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to update production schedule' },
      { status: 500 }
    )
  }
}

// DELETE /api/industries/manufacturing/schedules/[id] - Delete schedule
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    await prisma.productionSchedules.delete({
      where: {
        id,
        tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete schedule error:', error)
    return NextResponse.json(
      { error: 'Failed to delete production schedule' },
      { status: 500 }
    )
  }
}

