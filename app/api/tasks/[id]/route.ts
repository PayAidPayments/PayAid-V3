import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

// Resolve effective tenantId from request (same pattern as deals/contacts)
async function resolveTaskTenantId(
  request: NextRequest,
  jwtTenantId: string,
  userId: string
): Promise<string> {
  const requestTenantId = request.nextUrl.searchParams.get('tenantId') || undefined
  if (!requestTenantId) return jwtTenantId
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, email: true },
  }).catch(() => null)
  const userTenantId = user?.tenantId ?? null
  const hasAccess = jwtTenantId === requestTenantId || userTenantId === requestTenantId
  const isDemoTenantRequest =
    user?.email === 'admin@demo.com' &&
    (await prisma.tenant.findUnique({
      where: { id: requestTenantId },
      select: { name: true },
    }).then((t) => t?.name?.toLowerCase().includes('demo') ?? false).catch(() => false))
  if (hasAccess || isDemoTenantRequest) return requestTenantId
  return jwtTenantId
}

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().datetime().optional(),
  contactId: z.string().optional(),
  assignedToId: z.string().optional(),
  module: z.string().optional(),
  recurrenceRule: z.enum(['none', 'daily', 'weekly', 'monthly']).optional().nullable(),
  recurrenceEndDate: z.string().datetime().optional().nullable(),
})

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveTaskTenantId(request, jwtTenantId, userId)

    let task = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Fallback: find by id when tenant filter missed
    if (!task) {
      const byId = await prisma.task.findUnique({
        where: { id: resolvedParams.id },
        include: {
          contact: true,
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      })
      if (byId) {
        const allowed =
          byId.tenantId === jwtTenantId ||
          (await prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } }).then((u) => u?.tenantId === byId.tenantId))
        if (allowed) task = byId
      }
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get task error:', error)
    return NextResponse.json(
      { error: 'Failed to get task' },
      { status: 500 }
    )
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveTaskTenantId(request, jwtTenantId, userId)

    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    const existing = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validated.title) updateData.title = validated.title
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.priority) updateData.priority = validated.priority
    if (validated.status) {
      updateData.status = validated.status
      if (validated.status === 'completed') {
        updateData.completedAt = new Date()
      }
    }
    if (validated.dueDate) {
      updateData.dueDate = new Date(validated.dueDate)
    }
    if (validated.contactId) updateData.contactId = validated.contactId
    if (validated.assignedToId) updateData.assignedToId = validated.assignedToId
    if (validated.module) updateData.module = validated.module
    if (validated.recurrenceRule !== undefined) updateData.recurrenceRule = validated.recurrenceRule === 'none' || validated.recurrenceRule === null ? null : validated.recurrenceRule
    if (validated.recurrenceEndDate !== undefined) updateData.recurrenceEndDate = validated.recurrenceEndDate ? new Date(validated.recurrenceEndDate) : null

    const task = await prisma.task.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        contact: {
          select: {
            id: true,
            name: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update task error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveTaskTenantId(request, jwtTenantId, userId)

    const existing = await prisma.task.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    await prisma.task.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete task error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

