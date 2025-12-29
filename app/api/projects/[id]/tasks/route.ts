import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createTaskSchema = z.object({
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

const updateTaskSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  assignedToId: z.string().optional().nullable(),
  startDate: z.string().datetime().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  dependsOnTaskId: z.string().optional().nullable(),
  estimatedHours: z.number().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
})

// GET /api/projects/[id]/tasks - List all tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Verify project exists and belongs to tenant
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
    const status = searchParams.get('status')
    const assignedToId = searchParams.get('assignedToId')

    const where: any = {
      projectId: id,
    }

    if (status) {
      where.status = status
    }

    if (assignedToId) {
      where.assignedToId = assignedToId
    }

    const tasks = await prisma.projectTask.findMany({
      where,
      include: {
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
        { createdAt: 'asc' },
      ],
    })

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
        }
      })
    )

    return NextResponse.json({ tasks: tasksWithHours })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get project tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/projects/[id]/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

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
    const validated = createTaskSchema.parse(body)

    // Verify dependency task exists and belongs to same project
    if (validated.dependsOnTaskId) {
      const dependsOnTask = await prisma.projectTask.findFirst({
        where: {
          id: validated.dependsOnTaskId,
          projectId: id,
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
        projectId: id,
        name: validated.name,
        description: validated.description,
        status: validated.status || 'TODO',
        priority: validated.priority || 'MEDIUM',
        assignedToId: validated.assignedToId,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        dependsOnTaskId: validated.dependsOnTaskId,
        estimatedHours: validated.estimatedHours ? validated.estimatedHours : null,
        tags: validated.tags || [],
        notes: validated.notes,
      },
      include: {
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
    console.error('Create project task error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}

