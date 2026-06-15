import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import {
  canApproveOrRejectProjectsTimeEntry,
  isProjectsTimeAdminRole,
} from '@/lib/api/projects/time-approval-permissions'

const patchBodySchema = z
  .object({
    approvalStatus: z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CORRECTED']).optional(),
    invoicedAt: z.union([z.string().datetime(), z.null()]).optional(),
    invoiceId: z.string().max(120).nullable().optional(),
  })
  .strict()

function jsonTimeEntry(row: {
  id: string
  projectId: string
  taskId: string | null
  hours: unknown
  approvalStatus: string | null
  invoicedAt?: Date | null
  invoiceId?: string | null
  project: { name: string }
  task: { name: string } | null
  user?: { id: string; name: string; email: string } | null
}) {
  return {
    ...row,
    projectName: row.project.name,
    taskName: row.task?.name || null,
    hours: Number(row.hours),
    minutes: Math.round((Number(row.hours) % 1) * 60),
  }
}

// PATCH /api/projects/time-entries/[id] — Workflow C (approval) OR mark invoiced (P4 WIP)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId, roles } = await requireModuleAccess(request, 'projects')
    const roleList = roles || []

    const body = patchBodySchema.parse(await request.json())
    const hasInvoiceUpdate = body.invoicedAt !== undefined
    const hasApproval = body.approvalStatus !== undefined
    if ((hasInvoiceUpdate && hasApproval) || (!hasInvoiceUpdate && !hasApproval)) {
      return NextResponse.json(
        {
          error:
            'Send exactly one of: approvalStatus (approval workflow) or invoicedAt (mark/clear invoiced on approved billable time)',
        },
        { status: 400 }
      )
    }

    const entry = await prisma.timeEntry.findFirst({
      where: {
        id,
        project: { tenantId },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
            tenantId: true,
            ownerId: true,
          },
        },
        task: { select: { id: true, name: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (!entry) {
      return NextResponse.json({ error: 'Time entry not found' }, { status: 404 })
    }

    const pm = await prisma.projectMember.findFirst({
      where: {
        projectId: entry.projectId,
        userId,
        role: { in: ['PROJECT_MANAGER', 'project_manager', 'Project Manager'] },
      },
    })

    // --- Billing: set/clear invoicedAt (+ optional invoiceId) ---
    if (hasInvoiceUpdate) {
      if (!entry.billable) {
        return NextResponse.json({ error: 'Only billable entries can be marked invoiced' }, { status: 400 })
      }
      if ((entry.approvalStatus || 'DRAFT').toUpperCase() !== 'APPROVED') {
        return NextResponse.json({ error: 'Only approved entries can be marked invoiced' }, { status: 400 })
      }
      if (
        !canApproveOrRejectProjectsTimeEntry(
          userId,
          roleList,
          entry.userId,
          entry.project.ownerId,
          Boolean(pm)
        )
      ) {
        return NextResponse.json(
          { error: 'You do not have permission to mark this time entry invoiced' },
          { status: 403 }
        )
      }

      let nextInvoicedAt: Date | null = null
      if (body.invoicedAt !== null) {
        nextInvoicedAt = new Date(body.invoicedAt as string)
        if (Number.isNaN(nextInvoicedAt.getTime())) {
          return NextResponse.json({ error: 'Invalid invoicedAt' }, { status: 400 })
        }
      }

      let nextInvoiceId: string | null = entry.invoiceId ?? null
      if (body.invoiceId !== undefined) {
        nextInvoiceId = body.invoiceId
      }
      if (nextInvoicedAt === null) {
        nextInvoiceId = null
      }

      if (nextInvoiceId) {
        const inv = await prisma.invoice.findFirst({
          where: { id: nextInvoiceId, tenantId },
          select: { id: true },
        })
        if (!inv) {
          return NextResponse.json({ error: 'Invoice not found for this workspace' }, { status: 400 })
        }
      }

      const beforeInv = entry.invoicedAt
      const beforeId = entry.invoiceId

      const updated = await prisma.$transaction(async (tx) => {
        const row = await tx.timeEntry.update({
          where: { id },
          data: {
            invoicedAt: nextInvoicedAt,
            invoiceId: nextInvoiceId,
          },
          include: {
            project: { select: { id: true, name: true, code: true } },
            task: { select: { id: true, name: true } },
            user: { select: { id: true, name: true, email: true } },
          },
        })

        const projectLabel =
          row.project?.name || row.project?.code || row.project?.id || entry.projectId
        await tx.auditLog.create({
          data: {
            tenantId,
            entityType: 'projects_time_entry',
            entityId: id,
            changedBy: userId,
            changeSummary: `Time entry invoicing: ${beforeInv ? 'cleared' : 'set'} (${projectLabel})`,
            beforeSnapshot: {
              invoicedAt: beforeInv,
              invoiceId: beforeId,
              hours: Number(entry.hours),
            },
            afterSnapshot: {
              invoicedAt: row.invoicedAt,
              invoiceId: row.invoiceId,
              hours: Number(row.hours),
            },
          },
        })

        return row
      })

      return NextResponse.json({ timeEntry: jsonTimeEntry(updated) })
    }

    // --- Approval workflow ---
    const nextStatus = body.approvalStatus!
    const current = (entry.approvalStatus || 'DRAFT').toUpperCase()
    const next = nextStatus.toUpperCase()
    if (current === next) {
      return NextResponse.json({ timeEntry: jsonTimeEntry(entry as any) })
    }

    // Submit for review
    if (next === 'SUBMITTED') {
      if (!['DRAFT', 'CORRECTED', 'REJECTED'].includes(current)) {
        return NextResponse.json(
          { error: 'Only draft, corrected, or rejected entries can be submitted' },
          { status: 400 }
        )
      }
      if (entry.userId !== userId) {
        return NextResponse.json({ error: 'Only the author can submit this time entry' }, { status: 403 })
      }
    } else if (next === 'APPROVED') {
      if (current !== 'SUBMITTED') {
        return NextResponse.json({ error: 'Only submitted entries can be approved' }, { status: 400 })
      }
      if (
        !canApproveOrRejectProjectsTimeEntry(
          userId,
          roleList,
          entry.userId,
          entry.project.ownerId,
          Boolean(pm)
        )
      ) {
        return NextResponse.json(
          { error: 'You do not have permission to approve this time entry' },
          { status: 403 }
        )
      }
    } else if (next === 'REJECTED') {
      if (current !== 'SUBMITTED') {
        return NextResponse.json({ error: 'Only submitted entries can be rejected' }, { status: 400 })
      }
      if (
        !canApproveOrRejectProjectsTimeEntry(
          userId,
          roleList,
          entry.userId,
          entry.project.ownerId,
          Boolean(pm)
        )
      ) {
        return NextResponse.json(
          { error: 'You do not have permission to reject this time entry' },
          { status: 403 }
        )
      }
    } else if (next === 'DRAFT') {
      if (current !== 'REJECTED') {
        return NextResponse.json({ error: 'Only rejected entries can be moved back to draft' }, { status: 400 })
      }
      if (entry.userId !== userId && !isProjectsTimeAdminRole(roleList)) {
        return NextResponse.json({ error: 'Only the author can reopen a rejected entry' }, { status: 403 })
      }
    } else if (next === 'CORRECTED') {
      return NextResponse.json(
        { error: 'Corrected status is set by system flows; not supported via PATCH yet' },
        { status: 400 }
      )
    } else {
      return NextResponse.json({ error: 'Unsupported transition' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.timeEntry.update({
        where: { id },
        data: { approvalStatus: next },
        include: {
          project: { select: { id: true, name: true, code: true } },
          task: { select: { id: true, name: true } },
          user: { select: { id: true, name: true, email: true } },
        },
      })

      const projectLabel =
        row.project?.name || row.project?.code || row.project?.id || entry.projectId
      await tx.auditLog.create({
        data: {
          tenantId,
          entityType: 'projects_time_entry',
          entityId: id,
          changedBy: userId,
          changeSummary: `Time entry approval: ${current} → ${next} (${projectLabel})`,
          beforeSnapshot: {
            approvalStatus: current,
            projectId: entry.projectId,
            taskId: entry.taskId,
            hours: Number(entry.hours),
            authorUserId: entry.userId,
          },
          afterSnapshot: {
            approvalStatus: next,
            projectId: row.projectId,
            taskId: row.taskId,
            hours: Number(row.hours),
          },
        },
      })

      return row
    })

    return NextResponse.json({ timeEntry: jsonTimeEntry(updated) })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('PATCH time entry error:', error)
    return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 })
  }
}
