import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { applyMilestoneBillingHandoffInTx } from '@/lib/api/projects/milestone-billing-handoff-run'
import { milestoneMetBillingHandoff } from '@/lib/api/projects/milestone-billing-handoff'
import { canApproveMilestoneBilling } from '@/lib/api/projects/milestone-billing-approve-permissions'

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

/** Approve a MET milestone for billing (gates `ON_APPROVE` when `approvalRequired`). */
// POST /api/projects/[id]/milestones/[milestoneId]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id: projectId, milestoneId } = await params
    const { tenantId, userId, roles, licensedModules } = await requireModuleAccess(request, 'projects')
    const financeLicensed =
      licensedModules.includes('finance') || licensedModules.includes('invoicing')

    const row = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, project: { tenantId } },
      include: {
        project: {
          select: {
            id: true,
            tenantId: true,
            ownerId: true,
            name: true,
            currency: true,
            clientId: true,
            billingIsInterState: true,
            client: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    })
    if (!row) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 })
    }

    if ((row.billingTrigger || '').toUpperCase() !== 'ON_APPROVE') {
      return NextResponse.json(
        { error: 'Approve is only for milestones with billing trigger “Bill on approve”' },
        { status: 400 }
      )
    }
    if (!row.approvalRequired) {
      return NextResponse.json(
        { error: 'This milestone does not require approval (no action needed)' },
        { status: 400 }
      )
    }
    if ((row.status || '').toUpperCase() !== 'MET') {
      return NextResponse.json({ error: 'Milestone must be Met before billing approval' }, { status: 400 })
    }

    const pm = await prisma.projectMember.findFirst({
      where: {
        projectId,
        userId,
        role: { in: ['PROJECT_MANAGER', 'project_manager', 'Project Manager'] },
      },
    })

    if (!canApproveMilestoneBilling(userId, roles || [], row.project.ownerId ?? null, Boolean(pm))) {
      return NextResponse.json(
        { error: 'You do not have permission to approve this milestone for billing' },
        { status: 403 }
      )
    }

    if (row.approvedAt) {
      const ho =
        milestoneMetBillingHandoff(
          {
            id: row.id,
            name: row.name,
            status: row.status,
            billingTrigger: row.billingTrigger,
            approvalRequired: row.approvalRequired,
            approvedAt: row.approvedAt,
          },
          { id: row.project.id, name: row.project.name }
        ) ?? undefined

      return NextResponse.json({
        milestone: row,
        billingHandoff: ho
          ? { ...ho, invoiceDraftId: row.billingDraftInvoiceId || undefined }
          : undefined,
        alreadyApproved: true,
      })
    }

    let invoiceLimitRoom = true
    if (financeLicensed) {
      invoiceLimitRoom = await checkTenantLimits(tenantId, 'invoices', 1)
    }

    const beforeSnap = milestoneSnapshot({
      ...row,
      billingDraftInvoiceId: row.billingDraftInvoiceId ?? null,
      approvedAt: row.approvedAt ?? null,
    })

    const { milestone, billingHandoff, lostRace } = await prisma.$transaction(async (tx) => {
      const up = await tx.projectMilestone.updateMany({
        where: {
          id: milestoneId,
          projectId,
          approvedAt: null,
          approvalRequired: true,
        },
        data: {
          approvedAt: new Date(),
          approvedById: userId,
        },
      })

      if (up.count === 0) {
        const latest = await tx.projectMilestone.findFirst({ where: { id: milestoneId, projectId } })
        return { milestone: latest, billingHandoff: undefined, lostRace: true }
      }

      const milestone = await tx.projectMilestone.findFirst({ where: { id: milestoneId, projectId } })
      if (!milestone) {
        return { milestone: null, billingHandoff: undefined, lostRace: false }
      }

      const afterSnap = milestoneSnapshot({
        ...milestone,
        billingDraftInvoiceId: milestone.billingDraftInvoiceId ?? null,
        approvedAt: milestone.approvedAt ?? null,
      })

      const out = await applyMilestoneBillingHandoffInTx(tx, {
        tenantId,
        userId,
        milestoneBefore: beforeSnap,
        milestoneAfter: afterSnap,
        project: {
          id: row.project.id,
          name: row.project.name,
          currency: row.project.currency,
          clientId: row.project.clientId,
          billingIsInterState: row.project.billingIsInterState,
          client: row.project.client ?? null,
        },
        financeLicensed,
        invoiceLimitRoom,
      })

      return { milestone, billingHandoff: out.billingHandoff, lostRace: false }
    })

    if (!milestone) {
      return NextResponse.json({ error: 'Milestone disappeared during update' }, { status: 409 })
    }

    if (lostRace || (!billingHandoff && milestone.approvedAt)) {
      const ho =
        milestoneMetBillingHandoff(
          {
            id: milestone.id,
            name: milestone.name,
            status: milestone.status,
            billingTrigger: milestone.billingTrigger,
            approvalRequired: milestone.approvalRequired,
            approvedAt: milestone.approvedAt,
          },
          { id: row.project.id, name: row.project.name }
        ) ?? undefined

      return NextResponse.json({
        milestone,
        billingHandoff: ho
          ? { ...ho, invoiceDraftId: milestone.billingDraftInvoiceId || undefined }
          : undefined,
        alreadyApproved: true,
      })
    }

    return NextResponse.json({ milestone, billingHandoff })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('POST milestone approve error:', error)
    return NextResponse.json({ error: 'Failed to approve milestone' }, { status: 500 })
  }
}
