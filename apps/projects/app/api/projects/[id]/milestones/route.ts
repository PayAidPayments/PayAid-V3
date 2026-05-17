import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { applyMilestoneBillingHandoffInTx } from '@/lib/api/projects/milestone-billing-handoff-run'
import { ensureMilestoneApprovalChecklistTask } from '@/lib/api/projects/milestone-approval-scripting'
import { z } from 'zod'

function parseDueDate(input: string): Date | null {
  const d = new Date(input)
  return Number.isNaN(d.getTime()) ? null : d
}

const createMilestoneSchema = z
  .object({
    name: z.string().min(1).max(200),
    /** ISO datetime or `YYYY-MM-DD` */
    dueDate: z.string().min(4).max(40),
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

// POST /api/projects/[id]/milestones
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { tenantId, userId, licensedModules } = await requireModuleAccess(request, 'projects')
    const financeLicensed =
      licensedModules.includes('finance') || licensedModules.includes('invoicing')

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: {
        id: true,
        name: true,
        ownerId: true,
        currency: true,
        clientId: true,
        billingIsInterState: true,
        client: { select: { id: true, name: true, email: true, phone: true } },
      },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const v = createMilestoneSchema.parse(body)

    const due = parseDueDate(v.dueDate)
    if (!due) {
      return NextResponse.json({ error: 'Invalid dueDate' }, { status: 400 })
    }

    if (v.phaseId) {
      const phase = await prisma.projectPhase.findFirst({
        where: { id: v.phaseId, projectId },
      })
      if (!phase) {
        return NextResponse.json({ error: 'Phase not found on this project' }, { status: 400 })
      }
    }

    let invoiceLimitRoom = true
    if (financeLicensed) {
      invoiceLimitRoom = await checkTenantLimits(tenantId, 'invoices', 1)
    }

    const { milestone, billingHandoff, approvalChecklistTasksSeeded } = await prisma.$transaction(
      async (tx) => {
      const milestone = await tx.projectMilestone.create({
        data: {
          projectId,
          phaseId: v.phaseId ?? null,
          name: v.name,
          dueDate: due,
          sortOrder: v.sortOrder ?? 0,
          status: v.status ?? 'PENDING',
          approvalRequired: v.approvalRequired ?? false,
          billingTrigger: v.billingTrigger ?? null,
        },
      })
      const checklist = await ensureMilestoneApprovalChecklistTask(tx, {
        projectId,
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        dueDate: milestone.dueDate,
        billingTrigger: milestone.billingTrigger,
        approvalRequired: milestone.approvalRequired,
        assigneeUserId: project.ownerId ?? null,
      })

      const createdIsMet = (milestone.status || '').toUpperCase() === 'MET'
      if (!createdIsMet) {
        return {
          milestone,
          billingHandoff: undefined,
          approvalChecklistTasksSeeded: checklist.created ? 1 : 0,
        }
      }

      const approxBefore = milestoneSnapshot({
        id: milestone.id,
        name: milestone.name,
        status: 'PENDING',
        billingTrigger: null,
        approvalRequired: milestone.approvalRequired,
        approvedAt: null,
        billingDraftInvoiceId: null,
      })

      const out = await applyMilestoneBillingHandoffInTx(tx, {
        tenantId,
        userId,
        milestoneBefore: approxBefore,
        milestoneAfter: milestoneSnapshot({
          ...milestone,
          billingDraftInvoiceId: milestone.billingDraftInvoiceId ?? null,
          approvedAt: milestone.approvedAt ?? null,
        }),
        project: {
          id: project.id,
          name: project.name,
          currency: project.currency,
          clientId: project.clientId,
          billingIsInterState: project.billingIsInterState,
          client: project.client ?? null,
        },
        financeLicensed,
        invoiceLimitRoom,
      })

      return {
        milestone,
        billingHandoff: out.billingHandoff,
        approvalChecklistTasksSeeded: checklist.created ? 1 : 0,
      }
      }
    )

    return NextResponse.json({ milestone, billingHandoff, approvalChecklistTasksSeeded }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('POST project milestone error:', error)
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 })
  }
}
