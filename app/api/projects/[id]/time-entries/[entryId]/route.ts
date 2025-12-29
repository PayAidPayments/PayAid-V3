import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateTimeEntrySchema = z.object({
  taskId: z.string().optional().nullable(),
  date: z.string().datetime().optional(),
  hours: z.number().positive().optional(),
  description: z.string().optional().nullable(),
  billable: z.boolean().optional(),
  billingRate: z.number().optional().nullable(),
})

// PATCH /api/projects/[id]/time-entries/[entryId] - Update a time entry
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

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

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        projectId: id,
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    // Only allow user to edit their own entries (unless admin)
    // This check can be enhanced with role-based permissions
    const body = await request.json()
    const validated = updateTimeEntrySchema.parse(body)

    // Verify task belongs to project if changed
    if (validated.taskId !== undefined && validated.taskId) {
      const task = await prisma.projectTask.findFirst({
        where: {
          id: validated.taskId,
          projectId: id,
        },
      })

      if (!task) {
        return NextResponse.json(
          { error: 'Task not found in this project' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {}

    if (validated.taskId !== undefined) updateData.taskId = validated.taskId
    if (validated.hours !== undefined) updateData.hours = validated.hours
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.billable !== undefined) updateData.billable = validated.billable
    if (validated.billingRate !== undefined) updateData.billingRate = validated.billingRate

    if (validated.date !== undefined) {
      updateData.date = new Date(validated.date)
    }

    const updated = await prisma.timeEntry.update({
      where: { id: entryId },
      data: updateData,
      include: {
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

    // Update task and project totals
    if (updated.taskId) {
      const taskTimeEntries = await prisma.timeEntry.findMany({
        where: { taskId: updated.taskId },
      })
      const actualHours = taskTimeEntries.reduce((sum, entry) => {
        return sum + Number(entry.hours)
      }, 0)

      await prisma.projectTask.update({
        where: { id: updated.taskId },
        data: { actualHours },
      })
    }

    const projectTimeEntries = await prisma.timeEntry.findMany({
      where: { projectId: id },
    })
    const actualCost = projectTimeEntries.reduce((sum, entry) => {
      const hours = Number(entry.hours)
      const rate = entry.billingRate ? Number(entry.billingRate) : 0
      return sum + (hours * rate)
    }, 0)

    await prisma.project.update({
      where: { id },
      data: { actualCost },
    })

    return NextResponse.json({ timeEntry: updated })
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
    console.error('Update time entry error:', error)
    return NextResponse.json(
      { error: 'Failed to update time entry' },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id]/time-entries/[entryId] - Delete a time entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  try {
    const { id, entryId } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

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

    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: entryId,
        projectId: id,
      },
    })

    if (!timeEntry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    const taskId = timeEntry.taskId

    await prisma.timeEntry.delete({
      where: { id: entryId },
    })

    // Update task and project totals
    if (taskId) {
      const taskTimeEntries = await prisma.timeEntry.findMany({
        where: { taskId },
      })
      const actualHours = taskTimeEntries.reduce((sum, entry) => {
        return sum + Number(entry.hours)
      }, 0)

      await prisma.projectTask.update({
        where: { id: taskId },
        data: { actualHours },
      })
    }

    const projectTimeEntries = await prisma.timeEntry.findMany({
      where: { projectId: id },
    })
    const actualCost = projectTimeEntries.reduce((sum, entry) => {
      const hours = Number(entry.hours)
      const rate = entry.billingRate ? Number(entry.billingRate) : 0
      return sum + (hours * rate)
    }, 0)

    await prisma.project.update({
      where: { id },
      data: { actualCost },
    })

    return NextResponse.json({ message: 'Time entry deleted successfully' })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete time entry error:', error)
    return NextResponse.json(
      { error: 'Failed to delete time entry' },
      { status: 500 }
    )
  }
}

