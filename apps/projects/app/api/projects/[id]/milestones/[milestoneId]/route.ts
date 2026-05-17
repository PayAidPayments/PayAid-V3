import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { applyMilestoneBillingHandoffInTx } from '@/lib/api/projects/milestone-billing-handoff-run'
import { ensureMilestoneApprovalChecklistTask } from '@/lib/api/projects/milestone-approval-scripting'
import { milestoneMetBillingHandoff } from '@/lib/api/projects/milestone-billing-handoff'
import { z } from 'zod'

function parseDueDate(input: string): Date | null {
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

const patchMilestoneSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    dueDate: z.string().min(4).max(40).optional(),
    phaseId: z.string().nullable().optional(),
    sortOrder: z.number().int().optional(),
    status: z.enum(['PENDING', 'MET', 'MISSED']).optional(),
    approvalRequired: z.boolean().optional(),
    billingTrigger: z.enum(['NONE', 'ON_COMPLETE', 'ON_APPROVE']).nullable().optional(),
  })
  .strict()

function milestoneSnapshot(m: {
  id: string
  name: string
  status: string
  billingTrigger: string | null
  approvalRequired: boolean
  approvedAt: Date | null
  billingDraftInvoiceId: string | null
}) {
  return {
    id: m.id,
    name: m.name,
    status: m.status,
    billingTrigger: m.billingTrigger,
    approvalRequired: m.approvalRequired,
    approvedAt: m.approvedAt,
    billingDraftInvoiceId: m.billingDraftInvoiceId,
  }
}

// PATCH /api/projects/[id]/milestones/[milestoneId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id: projectId, milestoneId } = await params
    const { tenantId, userId, licensedModules } = await requireModuleAccess(request, 'projects')
    const financeLicensed =
      licensedModules.includes('finance') || licensedModules.includes('invoicing')

    const existing = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, project: { tenantId } },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            currency: true,
            clientId: true,
            billingIsInterState: true,
            client: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    const body = await request.json()
    const v = patchMilestoneSchema.parse(body)
    if (Object.keys(v).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    if (v.phaseId) {
      const phase = await prisma.projectPhase.findFirst({
        where: { id: v.phaseId, projectId },
      })
      if (!phase) {
        return NextResponse.json({ error: 'Phase not found on this project' }, { status: 400 })
      }
    }

    let dueDate: Date | undefined
    if (v.dueDate !== undefined) {
      const due = parseDueDate(v.dueDate)
      if (!due) {
        return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
      }
      dueDate = due
    }

    const transitionedToMet = v.status === 'MET' && (existing.status || '').toUpperCase() !== 'MET'
    const wasMet = (existing.status || '').toUpperCase() === 'MET'

    let invoiceLimitRoom = true
    if (financeLicensed) {
      invoiceLimitRoom = await checkTenantLimits(tenantId, 'invoices', 1)
    }

    const milestoneBeforeSnap = milestoneSnapshot({
      ...existing,
      billingDraftInvoiceId: existing.billingDraftInvoiceId ?? null,
      approvedAt: existing.approvedAt ?? null,
    })

    const { milestone, billingHandoff, approvalChecklistTasksSeeded } = await prisma.$transaction(
      async (tx) => {
      const milestone = await tx.projectMilestone.update({
        where: { id: milestoneId },
        data: {
          ...(v.name !== undefined && { name: v.name }),
          ...(dueDate !== undefined && { dueDate }),
          ...(v.sortOrder !== undefined && { sortOrder: v.sortOrder }),
          ...(v.status !== undefined && { status: v.status }),
          ...(v.approvalRequired !== undefined && { approvalRequired: v.approvalRequired }),
          ...(v.billingTrigger !== undefined && { billingTrigger: v.billingTrigger }),
          ...(v.phaseId !== undefined && { phaseId: v.phaseId }),
        },
      })

      let billingHandoff: Awaited<ReturnType<typeof applyMilestoneBillingHandoffInTx>>['billingHandoff']
      const checklist = await ensureMilestoneApprovalChecklistTask(tx, {
        projectId,
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        dueDate: milestone.dueDate,
        billingTrigger: milestone.billingTrigger,
        approvalRequired: milestone.approvalRequired,
        assigneeUserId: existing.project.ownerId ?? null,
      })

      const afterSnap = milestoneSnapshot({
        ...milestone,
        billingDraftInvoiceId: milestone.billingDraftInvoiceId ?? null,
        approvedAt: milestone.approvedAt ?? null,
      })
      const isMet = (milestone.status || '').toUpperCase() === 'MET'
      const handoffBefore = wasMet
        ? milestoneMetBillingHandoff(
            {
              id: existing.id,
              name: existing.name,
              status: existing.status,
              billingTrigger: existing.billingTrigger,
              approvalRequired: existing.approvalRequired,
              approvedAt: existing.approvedAt,
            },
            { id: existing.project.id, name: existing.project.name }
          )
        : null
      const handoffAfter = isMet
        ? milestoneMetBillingHandoff(
            {
              id: milestone.id,
              name: milestone.name,
              status: milestone.status,
              billingTrigger: milestone.billingTrigger,
              approvalRequired: milestone.approvalRequired,
              approvedAt: milestone.approvedAt,
            },
            { id: existing.project.id, name: existing.project.name }
          )
        : null
      const shouldApplyBillingHandoff = transitionedToMet || Boolean(handoffAfter && !handoffBefore)

      if (shouldApplyBillingHandoff) {
        const out = await applyMilestoneBillingHandoffInTx(tx, {
          tenantId,
          userId,
          milestoneBefore: milestoneBeforeSnap,
          milestoneAfter: afterSnap,
          project: {
            id: existing.project.id,
            name: existing.project.name,
            currency: existing.project.currency,
            clientId: existing.project.clientId,
            billingIsInterState: existing.project.billingIsInterState,
            client: existing.project.client ?? null,
          },
          financeLicensed,
          invoiceLimitRoom,
        })
        billingHandoff = out.billingHandoff
      }

      return { milestone, billingHandoff, approvalChecklistTasksSeeded: checklist.created ? 1 : 0 }
    })

    return NextResponse.json({ milestone, billingHandoff, approvalChecklistTasksSeeded })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('PATCH project milestone error:', error)
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/milestones/[milestoneId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id: projectId, milestoneId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const existing = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, project: { tenantId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    await prisma.projectMilestone.delete({ where: { id: milestoneId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('DELETE project milestone error:', error)
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 })
  }
}
