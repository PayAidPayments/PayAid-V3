import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { resolveCrmRequestTenantId } from '@/lib/crm/resolve-crm-request-tenant'
import { sendTaskReminder } from '@/lib/services/task-reminder'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { userId, tenantId: jwtTenantId } = await requireModuleAccess(request, 'crm')
    const tenantId = await resolveCrmRequestTenantId(request, jwtTenantId, userId)

    const task = await prisma.task.findFirst({
      where: { id: resolvedParams.id, tenantId },
      include: { contact: true, assignedTo: true },
    })

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    await sendTaskReminder({
      taskId: task.id,
      title: task.title,
      dueDate: task.dueDate,
      contactPhone: task.contact?.phone ?? null,
      contactEmail: task.contact?.email ?? null,
      assigneeEmail: task.assignedTo?.email ?? null,
    }).catch(() => {})

    await prisma.task.update({
      where: { id: resolvedParams.id },
      data: { reminderSentAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: 'Reminder sent',
      reminderSentAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Task remind error:', error)
    return NextResponse.json({ error: 'Failed to send reminder' }, { status: 500 })
  }
}
