import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { z } from 'zod'
import { assertCrmRoleAllowed, CrmRoleError } from '@/lib/crm/rbac'
import { logCrmAudit } from '@/lib/audit-log-crm'

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  contactId: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
})

const taskInclude = {
  contact: true,
  assignedTo: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} as const

// GET /api/tasks/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    let task = await prisma.task.findFirst({
      where: { id: resolvedParams.id, tenantId },
      include: taskInclude,
    })

    if (!task) {
      const byId = await prisma.task.findUnique({
        where: { id: resolvedParams.id },
        include: taskInclude,
      })
      if (byId) {
        const allowed =
          byId.tenantId === jwtTenantId ||
          (await prisma.user
            .findUnique({ where: { id: userId }, select: { tenantId: true } })
            .then((u) => u?.tenantId === byId.tenantId))
        if (allowed) task = byId
      }
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get task error:', error)
    return NextResponse.json({ error: 'Failed to get task' }, { status: 500 })
  }
}

// PATCH /api/tasks/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const body = await request.json()
    const validated = updateTaskSchema.parse(body)

    const existing = await prisma.task.findFirst({
      where: { id: resolvedParams.id, tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    if (validated.contactId) {
      const contact = await prisma.contact.findFirst({
        where: { id: validated.contactId, tenantId },
      })
      if (!contact) {
        return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
      }
    }

    if (validated.assignedToId) {
      const assignedUser = await prisma.user.findFirst({
        where: { id: validated.assignedToId, tenantId },
      })
      if (!assignedUser) {
        return NextResponse.json({ error: 'Assigned user not found' }, { status: 404 })
      }
    }

    const updateData: Record<string, unknown> = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.priority !== undefined) updateData.priority = validated.priority
    if (validated.status !== undefined) {
      updateData.status = validated.status
      if (validated.status === 'completed') {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }
    if (validated.dueDate !== undefined) {
      updateData.dueDate = validated.dueDate === null ? null : new Date(validated.dueDate)
    }
    if (validated.contactId !== undefined) {
      updateData.contactId = validated.contactId
    }
    if (validated.assignedToId !== undefined) {
      updateData.assignedToId = validated.assignedToId
    }

    const task = await prisma.task.update({
      where: { id: resolvedParams.id },
      data: updateData,
      include: {
        contact: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Update task error:', error)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId, roles } = await requireModuleAccess(request, 'crm')
    assertCrmRoleAllowed(roles, ['admin', 'manager'], 'task delete')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const existing = await prisma.task.findFirst({
      where: { id: resolvedParams.id, tenantId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await logCrmAudit({
      tenantId,
      userId,
      entityType: 'task',
      entityId: resolvedParams.id,
      action: 'delete',
      changeSummary: `Task deleted: ${existing.title}`,
      beforeSnapshot: { title: existing.title, status: existing.status, priority: existing.priority },
    })

    await prisma.task.delete({
      where: { id: resolvedParams.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof CrmRoleError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete task error:', error)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
