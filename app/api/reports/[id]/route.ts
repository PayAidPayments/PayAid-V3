import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateReportSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  config: z.record(z.any()).optional(),
  scheduleConfig: z.record(z.any()).optional().nullable(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/reports/[id] - Get a single report
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const report = await prisma.report.findFirst({
      where: {
        id,
        tenantId,
        OR: [
          { isPublic: true },
          { createdById: userId },
        ],
      },
      include: {
        template: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        scheduledRuns: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    return NextResponse.json({ report })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get report error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch report' },
      { status: 500 }
    )
  }
}

// PATCH /api/reports/[id] - Update a report
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const report = await prisma.report.findFirst({
      where: {
        id,
        tenantId,
        createdById: userId, // Only creator can update
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateReportSchema.parse(body)

    const updateData: any = {}

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.config !== undefined) updateData.config = validated.config
    if (validated.scheduleConfig !== undefined) updateData.scheduleConfig = validated.scheduleConfig
    if (validated.isPublic !== undefined) updateData.isPublic = validated.isPublic
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    // Recalculate next run time if schedule changed
    if (validated.scheduleConfig !== undefined && report.type === 'scheduled') {
      const scheduleConfig = validated.scheduleConfig || report.scheduleConfig
      if (scheduleConfig) {
        updateData.nextRunAt = calculateNextRunTime(scheduleConfig)
      }
    }

    const updated = await prisma.report.update({
      where: { id },
      data: updateData,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ report: updated })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update report error:', error)
    return NextResponse.json(
      { error: 'Failed to update report' },
      { status: 500 }
    )
  }
}

// DELETE /api/reports/[id] - Delete a report
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const report = await prisma.report.findFirst({
      where: {
        id,
        tenantId,
        createdById: userId, // Only creator can delete
      },
    })

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    await prisma.report.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Report deleted successfully' })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete report error:', error)
    return NextResponse.json(
      { error: 'Failed to delete report' },
      { status: 500 }
    )
  }
}

// Helper function to calculate next run time
function calculateNextRunTime(scheduleConfig: any): Date {
  const now = new Date()
  const { frequency, dayOfWeek, dayOfMonth, time } = scheduleConfig

  let nextRun = new Date(now)

  if (frequency === 'daily') {
    nextRun.setDate(now.getDate() + 1)
    if (time) {
      const [hours, minutes] = time.split(':')
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
  } else if (frequency === 'weekly') {
    const targetDay = dayOfWeek || 1
    const currentDay = now.getDay()
    const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7
    nextRun.setDate(now.getDate() + daysUntilTarget)
    if (time) {
      const [hours, minutes] = time.split(':')
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
  } else if (frequency === 'monthly') {
    const targetDay = dayOfMonth || 1
    nextRun.setMonth(now.getMonth() + 1)
    nextRun.setDate(targetDay)
    if (time) {
      const [hours, minutes] = time.split(':')
      nextRun.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
  }

  return nextRun
}

