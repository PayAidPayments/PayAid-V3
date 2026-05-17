import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { checkTenantLimits } from '@/lib/middleware/tenant'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { applyMilestoneBillingHandoffInTx } from '@/lib/api/projects/milestone-billing-handoff-run'
import { milestoneMetBillingHandoff } from '@/lib/api/projects/milestone-billing-handoff'

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

/** POST — create Finance draft when milestone is eligible and no draft exists yet. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; milestoneId: string }> }
) {
  try {
    const { id: projectId, milestoneId } = await params
    const { tenantId, userId, licensedModules } = await requireModuleAccess(request, 'projects')
    const financeLicensed =
      licensedModules.includes('finance') || licensedModules.includes('invoicing')

    const row = await prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId, project: { tenantId } },
      include: {
        project: {
          select: {
            id: true,
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

    if (row.billingDraftInvoiceId) {
      const ho = milestoneMetBillingHandoff(
        {
          id: row.id,
          name: row.name,
          status: row.status,
          billingTrigger: row.billingTrigger,
          approvalRequired: row.approvalRequired,
          approvedAt: row.approvedAt,
        },
        { id: row.project.id, name: row.project.name }
      )
      return NextResponse.json({
        milestone: row,
        billingHandoff: ho
          ? { ...ho, invoiceDraftId: row.billingDraftInvoiceId }
          : undefined,
        alreadyHasDraft: true,
      })
    }

    const eligible = milestoneMetBillingHandoff(
      {
        id: row.id,
        name: row.name,
        status: row.status,
        billingTrigger: row.billingTrigger,
        approvalRequired: row.approvalRequired,
        approvedAt: row.approvedAt,
      },
      { id: row.project.id, name: row.project.name }
    )
    if (!eligible) {
      return NextResponse.json(
        {
          error:
            'Milestone is not eligible for billing handoff (must be Met, with billing trigger satisfied)',
        },
        { status: 400 }
      )
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

    const { billingHandoff, milestone } = await prisma.$transaction(async (tx) => {
      const latest = await tx.projectMilestone.findFirst({ where: { id: milestoneId, projectId } })
      if (!latest) throw new Error('MILESTONE_MISSING')

      const afterSnap = milestoneSnapshot({
        ...latest,
        billingDraftInvoiceId: latest.billingDraftInvoiceId ?? null,
        approvedAt: latest.approvedAt ?? null,
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

      const updated = await tx.projectMilestone.findFirst({ where: { id: milestoneId, projectId } })
      return { billingHandoff: out.billingHandoff, milestone: updated }
    })

    return NextResponse.json({
      milestone,
      billingHandoff,
      financeLicensed,
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error as { moduleId: string })
    }
    console.error('POST milestone billing-handoff error:', error)
    return NextResponse.json({ error: 'Failed to run billing handoff' }, { status: 500 })
  }
}
