import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createReportSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['custom', 'template', 'scheduled']).default('custom'),
  config: z.record(z.any()), // JSON object for report configuration
  templateId: z.string().optional(),
  scheduleConfig: z.record(z.any()).optional(),
  isPublic: z.boolean().optional(),
})

const updateReportSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  config: z.record(z.any()).optional(),
  scheduleConfig: z.record(z.any()).optional().nullable(),
  isPublic: z.boolean().optional(),
  isActive: z.boolean().optional(),
})

// GET /api/reports - List all reports
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId,
      OR: [
        { isPublic: true },
        { createdById: userId },
      ],
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.template = {
        category,
      }
    }

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
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
          _count: {
            select: {
              scheduledRuns: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'analytics')

    const body = await request.json()
    const validated = createReportSchema.parse(body)

    // Calculate next run time if scheduled
    let nextRunAt: Date | null = null
    if (validated.type === 'scheduled' && validated.scheduleConfig) {
      nextRunAt = calculateNextRunTime(validated.scheduleConfig)
    }

    const report = await prisma.report.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        type: validated.type,
        config: validated.config,
        templateId: validated.templateId,
        scheduleConfig: validated.scheduleConfig || undefined,
        nextRunAt,
        createdById: userId,
        isPublic: validated.isPublic || false,
      },
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

    return NextResponse.json({ report }, { status: 201 })
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
    console.error('Create report error:', error)
    return NextResponse.json(
      { error: 'Failed to create report' },
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
    const targetDay = dayOfWeek || 1 // Monday by default
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

