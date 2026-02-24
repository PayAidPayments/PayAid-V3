import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const fromTemplateSchema = z.object({
  templateId: z.string().min(1),
  contactId: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

// POST /api/tasks/from-template - Create a task from a template
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { templateId, contactId, dueDate } = fromTemplateSchema.parse(body)

    const template = await prisma.taskTemplate.findFirst({
      where: { id: templateId, tenantId },
    })

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    let due: Date | null = null
    if (dueDate) {
      due = new Date(dueDate)
    } else if (template.defaultDueDays != null) {
      const d = new Date()
      d.setDate(d.getDate() + template.defaultDueDays)
      due = d
    }

    const task = await prisma.task.create({
      data: {
        tenantId,
        title: template.title,
        description: template.description,
        priority: template.priority,
        status: 'pending',
        module: template.module,
        dueDate: due,
        contactId: contactId ?? undefined,
        assignedToId: userId,
      },
      include: {
        contact: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Create task from template error:', error)
    return NextResponse.json(
      { error: 'Failed to create task from template' },
      { status: 500 }
    )
  }
}
