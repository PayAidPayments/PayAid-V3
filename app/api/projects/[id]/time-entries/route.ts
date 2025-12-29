import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createTimeEntrySchema = z.object({
  taskId: z.string().optional(),
  date: z.string().datetime(),
  hours: z.number().positive(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
  billingRate: z.number().optional(),
})

const updateTimeEntrySchema = z.object({
  taskId: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
  hours: z.number().positive().optional(),
  description: z.string().optional().nullable(),
  billable: z.boolean().optional(),
  billingRate: z.number().optional().nullable(),
})

// GET /api/projects/[id]/time-entries - List all time entries for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify project exists
    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get('taskId')
    const userIdFilter = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {
      projectId: id,
    }

    if (taskId) {
      where.taskId = taskId
    }

    if (userIdFilter) {
      where.userId = userIdFilter
    }

    if (startDate || endDate) {
      where.date = {}
      if (startDate) {
        where.date.gte = new Date(startDate)
      }
      if (endDate) {
        where.date.lte = new Date(endDate)
      }
    }

    const timeEntries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Calculate totals
    const totals = timeEntries.reduce(
      (acc, entry) => {
        const hours = Number(entry.hours)
        acc.totalHours += hours
        if (entry.billable && entry.billingRate) {
          acc.billableAmount += hours * Number(entry.billingRate)
        }
        return acc
      },
      { totalHours: 0, billableAmount: 0 }
    )

    return NextResponse.json({
      timeEntries,
      totals,
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get project time entries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/time-entries - Create a new time entry
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    // Verify project exists
    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = createTimeEntrySchema.parse(body)

    // Verify task belongs to project if provided
    if (validated.taskId) {
      const task = await prisma.projectTask.findFirst({
        where: {
          id: validated.taskId,
          projectId: id,
        },
      })

      if (!task) {
        return NextResponse.json(
          { error: 'Task not found in this project' },
          { status: 400 }
        )
      }
    }

    const timeEntry = await prisma.timeEntry.create({
      data: {
        projectId: id,
        taskId: validated.taskId,
        userId: userId, // Use authenticated user
        date: new Date(validated.date),
        hours: validated.hours,
        description: validated.description,
        billable: validated.billable || false,
        billingRate: validated.billingRate || null,
      },
      include: {
        task: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Update task actual hours
    if (validated.taskId) {
      const taskTimeEntries = await prisma.timeEntry.findMany({
        where: { taskId: validated.taskId },
      })
      const actualHours = taskTimeEntries.reduce((sum, entry) => {
        return sum + Number(entry.hours)
      }, 0)

      await prisma.projectTask.update({
        where: { id: validated.taskId },
        data: { actualHours },
      })
    }

    // Update project actual cost
    const projectTimeEntries = await prisma.timeEntry.findMany({
      where: { projectId: id },
    })
    const actualCost = projectTimeEntries.reduce((sum, entry) => {
      const hours = Number(entry.hours)
      const rate = entry.billingRate ? Number(entry.billingRate) : 0
      return sum + (hours * rate)
    }, 0)

    await prisma.project.update({
      where: { id },
      data: { actualCost },
    })

    return NextResponse.json({ timeEntry }, { status: 201 })
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
    console.error('Create time entry error:', error)
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    )
  }
}

