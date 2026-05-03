import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createTaskSchema = z.object({
  projectId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  dueDate: z.string().datetime().optional(),
  dependsOnTaskId: z.string().optional(),
  estimatedHours: z.number().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

// GET /api/projects/tasks - List all tasks across all projects
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const assignedToId = searchParams.get('assignedToId')
    const priority = searchParams.get('priority')
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

    if (status) {
      where.status = status
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (priority) {
      where.priority = priority
    }

    const [tasks, total] = await Promise.all([
      prisma.projectTask.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          dependsOnTask: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          _count: {
            select: {
              timeEntries: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.projectTask.count({ where }),
    ])

    // Calculate actual hours for each task
    const tasksWithHours = await Promise.all(
      tasks.map(async (task) => {
        const timeEntries = await prisma.timeEntry.findMany({
          where: { taskId: task.id },
        })
        const actualHours = timeEntries.reduce((sum, entry) => {
          return sum + Number(entry.hours)
        }, 0)

        return {
          ...task,
          actualHours,
          projectName: task.project.name,
        }
      })
    )

    return NextResponse.json({
      tasks: tasksWithHours,
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
    console.error('Get tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/projects/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const body = await request.json()
    const validated = createTaskSchema.parse(body)

    // Verify project exists and belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: validated.projectId,
        tenantId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify dependency task exists if provided
    if (validated.dependsOnTaskId) {
      const dependsOnTask = await prisma.projectTask.findFirst({
        where: {
          id: validated.dependsOnTaskId,
          projectId: validated.projectId,
        },
      })

      if (!dependsOnTask) {
        return NextResponse.json(
          { error: 'Dependency task not found' },
          { status: 400 }
        )
      }
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId: validated.projectId,
        name: validated.name,
        description: validated.description,
        status: validated.status || 'TODO',
        priority: validated.priority || 'MEDIUM',
        assignedToId: validated.assignedToId,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        dependsOnTaskId: validated.dependsOnTaskId,
        estimatedHours: validated.estimatedHours || null,
        tags: validated.tags || [],
        notes: validated.notes,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        dependsOnTask: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    })

    return NextResponse.json({ task }, { status: 201 })
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
    console.error('Create task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

