import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  actualStartDate: z.string().datetime().optional().nullable(),
  actualEndDate: z.string().datetime().optional().nullable(),
  budget: z.number().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  ownerId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  progress: z.number().min(0).max(100).optional(),
})

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        tasks: {
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
              },
            },
            _count: {
              select: {
                timeEntries: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        budgets: {
          orderBy: {
            category: 'asc',
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            timeEntries: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Calculate actual cost from time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    const actualCost = timeEntries.reduce((sum, entry) => {
      const hours = Number(entry.hours)
      const rate = entry.billingRate ? Number(entry.billingRate) : 0
      return sum + (hours * rate)
    }, 0)

    // Calculate total hours
    const totalHours = timeEntries.reduce((sum, entry) => {
      return sum + Number(entry.hours)
    }, 0)

    return NextResponse.json({
      project: {
        ...project,
        actualCost,
        totalHours,
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get project error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const body = await request.json()
    const validated = updateProjectSchema.parse(body)

    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const updateData: any = {}

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.code !== undefined) updateData.code = validated.code
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.priority !== undefined) updateData.priority = validated.priority
    if (validated.ownerId !== undefined) updateData.ownerId = validated.ownerId
    if (validated.clientId !== undefined) updateData.clientId = validated.clientId
    if (validated.tags !== undefined) updateData.tags = validated.tags
    if (validated.notes !== undefined) updateData.notes = validated.notes
    if (validated.progress !== undefined) updateData.progress = validated.progress
    if (validated.budget !== undefined) updateData.budget = validated.budget

    if (validated.startDate !== undefined) {
      updateData.startDate = validated.startDate ? new Date(validated.startDate) : null
    }
    if (validated.endDate !== undefined) {
      updateData.endDate = validated.endDate ? new Date(validated.endDate) : null
    }
    if (validated.actualStartDate !== undefined) {
      updateData.actualStartDate = validated.actualStartDate ? new Date(validated.actualStartDate) : null
    }
    if (validated.actualEndDate !== undefined) {
      updateData.actualEndDate = validated.actualEndDate ? new Date(validated.actualEndDate) : null
    }

    // Set actual dates when status changes
    if (validated.status === 'IN_PROGRESS' && !project.actualStartDate) {
      updateData.actualStartDate = new Date()
    }
    if (validated.status === 'COMPLETED' && !project.actualEndDate) {
      updateData.actualEndDate = new Date()
    }

    const updated = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            tasks: true,
            members: true,
            timeEntries: true,
          },
        },
      },
    })

    return NextResponse.json({ project: updated })
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
    console.error('Update project error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const project = await prisma.project.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            tasks: true,
            timeEntries: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Prevent deletion if project has tasks or time entries
    if (project._count.tasks > 0 || project._count.timeEntries > 0) {
      return NextResponse.json(
        { error: 'Cannot delete project with tasks or time entries. Please archive it instead.' },
        { status: 400 }
      )
    }

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Project deleted successfully' })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete project error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}

