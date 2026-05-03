import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { sendTaskReminder } from '@/lib/services/task-reminder'

// POST /api/tasks/remind/[id] - Send reminder (WhatsApp/Email when wired), update reminderSentAt
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

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
      contactPhone: task.contact?.phone ?? task.contact?.mobile ?? null,
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
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    )
  }
}
