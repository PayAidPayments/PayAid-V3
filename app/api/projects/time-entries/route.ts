import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createTimeEntrySchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  date: z.string().datetime(),
  hours: z.number().positive(),
  description: z.string().optional(),
  billable: z.boolean().optional(),
  billingRate: z.number().optional(),
})

// GET /api/projects/time-entries - List all time entries across all projects
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'projects')

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')
    const taskId = searchParams.get('taskId')
    const userIdFilter = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get all projects for this tenant first
    const projects = await prisma.project.findMany({
      where: { tenantId },
      select: { id: true },
    })
    const projectIds = projects.map(p => p.id)

    const where: any = {
      projectId: {
        in: projectIds,
      },
    }

    if (projectId) {
      where.projectId = projectId
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

    const [timeEntries, total] = await Promise.all([
      prisma.timeEntry.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.timeEntry.count({ where }),
    ])

    // Calculate totals
    const allEntries = await prisma.timeEntry.findMany({ where })
    const totals = allEntries.reduce(
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

    // Calculate this week and this month totals
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const thisWeekEntries = await prisma.timeEntry.findMany({
      where: {
        ...where,
        date: { gte: startOfWeek },
      },
    })

    const thisMonthEntries = await prisma.timeEntry.findMany({
      where: {
        ...where,
        date: { gte: startOfMonth },
      },
    })

    const thisWeek = thisWeekEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)
    const thisMonth = thisMonthEntries.reduce((sum, entry) => sum + Number(entry.hours), 0)

    return NextResponse.json({
      entries: timeEntries.map(entry => ({
        ...entry,
        projectName: entry.project.name,
        taskName: entry.task?.name || null,
        hours: Number(entry.hours),
        minutes: Math.round((Number(entry.hours) % 1) * 60),
      })),
      totals: {
        total: totals.totalHours,
        thisWeek,
        thisMonth,
        billableAmount: totals.billableAmount,
      },
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
    console.error('Get time entries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    )
  }
}

// POST /api/projects/time-entries - Create a new time entry
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'projects')

    const body = await request.json()
    const validated = createTimeEntrySchema.parse(body)

    // Verify project exists
    const project = await prisma.project.findFirst({
      where: {
        id: validated.projectId,
        tenantId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify task belongs to project if provided
    if (validated.taskId) {
      const task = await prisma.projectTask.findFirst({
        where: {
          id: validated.taskId,
          projectId: validated.projectId,
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
        projectId: validated.projectId,
        taskId: validated.taskId,
        userId: userId,
        date: new Date(validated.date),
        hours: validated.hours,
        description: validated.description,
        billable: validated.billable || false,
        billingRate: validated.billingRate || null,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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

    // Update task actual hours if task provided
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
      where: { projectId: validated.projectId },
    })
    const actualCost = projectTimeEntries.reduce((sum, entry) => {
      const hours = Number(entry.hours)
      const rate = entry.billingRate ? Number(entry.billingRate) : 0
      return sum + (hours * rate)
    }, 0)

    await prisma.project.update({
      where: { id: validated.projectId },
      data: { actualCost },
    })

    return NextResponse.json({ 
      timeEntry: {
        ...timeEntry,
        projectName: timeEntry.project.name,
        taskName: timeEntry.task?.name || null,
        hours: Number(timeEntry.hours),
        minutes: Math.round((Number(timeEntry.hours) % 1) * 60),
      }
    }, { status: 201 })
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

