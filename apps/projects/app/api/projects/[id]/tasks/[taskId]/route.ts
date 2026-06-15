import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

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

// GET /api/projects/[id]/tasks/[taskId] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

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

    const task = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectId: id,
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
        dependentTasks: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        timeEntries: {
          include: {
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
        },
        _count: {
          select: {
            timeEntries: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Calculate actual hours
    const actualHours = task.timeEntries.reduce((sum, entry) => {
      return sum + Number(entry.hours)
    }, 0)

    return NextResponse.json({
      task: {
        ...task,
        actualHours,
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get project task error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id]/tasks/[taskId] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

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

    const task = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectId: id,
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    const updateData: any = {}

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.priority !== undefined) updateData.priority = validated.priority
    if (validated.assignedToId !== undefined) updateData.assignedToId = validated.assignedToId
    if (validated.dependsOnTaskId !== undefined) updateData.dependsOnTaskId = validated.dependsOnTaskId
    if (validated.estimatedHours !== undefined) updateData.estimatedHours = validated.estimatedHours
    if (validated.progress !== undefined) updateData.progress = validated.progress
    if (validated.tags !== undefined) updateData.tags = validated.tags
    if (validated.notes !== undefined) updateData.notes = validated.notes

    if (validated.startDate !== undefined) {
      updateData.startDate = validated.startDate ? new Date(validated.startDate) : null
    }
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate ? new Date(validated.dueDate) : null
    }

    // Set completedAt when status changes to DONE
    if (validated.status === 'DONE' && task.status !== 'DONE') {
      updateData.completedAt = new Date()
    } else if (validated.status !== 'DONE' && task.status === 'DONE') {
      updateData.completedAt = null
    }

    // Verify dependency task if changed
    if (validated.dependsOnTaskId !== undefined && validated.dependsOnTaskId) {
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

    const updated = await prisma.projectTask.update({
      where: { id: taskId },
      data: updateData,
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

    return NextResponse.json({ task: updated })
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
    console.error('Update project task error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

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

    const task = await prisma.projectTask.findFirst({
      where: {
        id: taskId,
        projectId: id,
      },
      include: {
        _count: {
          select: {
            timeEntries: true,
            dependentTasks: true,
          },
        },
      },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    // Prevent deletion if task has dependent tasks or time entries
    if (task._count.dependentTasks > 0) {
      return NextResponse.json(
        { error: 'Cannot delete task that has dependent tasks' },
        { status: 400 }
      )
    }

    if (task._count.timeEntries > 0) {
      return NextResponse.json(
        { error: 'Cannot delete task with time entries' },
        { status: 400 }
      )
    }

    await prisma.projectTask.delete({
      where: { id: taskId },
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete project task error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

