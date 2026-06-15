import type { Prisma } from '@prisma/client'
import {
  auditSummaryForMilestoneBillingHandoff,
  milestoneMetBillingHandoff,
  type MilestoneBillingHandoffPayload,
} from '@/lib/api/projects/milestone-billing-handoff'
import { createMilestoneHandoffDraftInvoice } from '@/lib/api/projects/create-milestone-handoff-draft-invoice'

type MilestoneHandoffSnapshot = {
  id: string
  name: string
  status: string
  billingTrigger: string | null
  approvalRequired: boolean
  approvedAt: Date | null
  billingDraftInvoiceId?: string | null
}

export type BillingHandoffProjectSnapshot = {
  id: string
  name: string
  currency?: string | null
  clientId?: string | null
  /** Null = use tenant `invoiceSettings.projectsMilestoneHandoff.defaultInterState`. */
  billingIsInterState?: boolean | null
  client?: {
    id: string
    name: string | null
    email: string | null
    phone?: string | null
  } | null
}

export async function applyMilestoneBillingHandoffInTx(
  tx: Prisma.TransactionClient,
  opts: {
    tenantId: string
    userId: string
    milestoneBefore: MilestoneHandoffSnapshot
    milestoneAfter: MilestoneHandoffSnapshot
    project: BillingHandoffProjectSnapshot
    financeLicensed: boolean
    invoiceLimitRoom: boolean
  }
): Promise<{ billingHandoff?: MilestoneBillingHandoffPayload }> {
  const { milestoneAfter } = opts

  if (milestoneAfter.billingDraftInvoiceId) {
    const ho =
      milestoneMetBillingHandoff(
        {
          id: milestoneAfter.id,
          name: milestoneAfter.name,
          status: milestoneAfter.status,
          billingTrigger: milestoneAfter.billingTrigger,
          approvalRequired: milestoneAfter.approvalRequired,
          approvedAt: milestoneAfter.approvedAt,
        },
        { id: opts.project.id, name: opts.project.name }
      ) ?? undefined
    if (!ho) return {}
    return {
      billingHandoff: { ...ho, invoiceDraftId: milestoneAfter.billingDraftInvoiceId },
    }
  }

  const handoff = milestoneMetBillingHandoff(
    {
      id: milestoneAfter.id,
      name: milestoneAfter.name,
      status: milestoneAfter.status,
      billingTrigger: milestoneAfter.billingTrigger,
      approvalRequired: milestoneAfter.approvalRequired,
      approvedAt: milestoneAfter.approvedAt,
    },
    { id: opts.project.id, name: opts.project.name }
  )
  if (!handoff) return {}

  await tx.auditLog.create({
    data: {
      tenantId: opts.tenantId,
      entityType: 'projects_milestone',
      entityId: milestoneAfter.id,
      changedBy: opts.userId,
      changeSummary: auditSummaryForMilestoneBillingHandoff(handoff, {
        approvalRequired: milestoneAfter.approvalRequired,
      }),
      beforeSnapshot: {
        status: opts.milestoneBefore.status,
        billingTrigger: opts.milestoneBefore.billingTrigger,
        approvedAt: opts.milestoneBefore.approvedAt,
      },
      afterSnapshot: {
        status: milestoneAfter.status,
        billingTrigger: milestoneAfter.billingTrigger,
        approvedAt: milestoneAfter.approvedAt,
      },
    },
  })

  let invoiceDraftId: string | undefined

  if (opts.financeLicensed && opts.invoiceLimitRoom) {
    try {
      const created = await createMilestoneHandoffDraftInvoice(tx, {
        tenantId: opts.tenantId,
        milestoneId: milestoneAfter.id,
        milestoneName: milestoneAfter.name,
        projectId: opts.project.id,
        projectName: opts.project.name,
        trigger: handoff.trigger,
        project: {
          currency: opts.project.currency,
          clientId: opts.project.clientId ?? null,
          billingIsInterState: opts.project.billingIsInterState,
          client: opts.project.client ?? null,
        },
      })
      invoiceDraftId = created.id
      await tx.projectMilestone.update({
        where: { id: milestoneAfter.id },
        data: { billingDraftInvoiceId: created.id },
      })
      await tx.auditLog.create({
        data: {
          tenantId: opts.tenantId,
          entityType: 'invoice',
          entityId: created.id,
          changedBy: opts.userId,
          changeSummary: `Projects milestone invoice trigger: draft ${created.invoiceNumber} (${handoff.trigger}) for milestone "${milestoneAfter.name}".`,
          afterSnapshot: {
            milestoneId: milestoneAfter.id,
            projectId: opts.project.id,
            trigger: handoff.trigger,
            invoiceNumber: created.invoiceNumber,
            source: 'projects_milestone_handoff',
          },
        },
      })
    } catch (e) {
      console.error('milestone billing draft invoice create failed', e)
    }
  }

  return invoiceDraftId
    ? { billingHandoff: { ...handoff, invoiceDraftId } }
    : { billingHandoff: handoff }
}
