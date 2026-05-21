import type { PrismaClient } from '@prisma/client'

export type MilestoneInvoicePrefill = {
  projectId: string
  projectName: string
  milestoneId: string
  milestoneName: string
  customerId: string | null
  customerName: string | null
  notesSuggestion: string
  billingDraftInvoiceId: string | null
  redirectToEdit: boolean
}

export async function getMilestoneInvoicePrefill(
  db: Pick<PrismaClient, 'project' | 'projectMilestone' | 'contact'>,
  input: {
    tenantId: string
    projectId: string
    milestoneId: string
    customerId?: string | null
  }
): Promise<MilestoneInvoicePrefill | null> {
  const milestone = await db.projectMilestone.findFirst({
    where: {
      id: input.milestoneId,
      projectId: input.projectId,
      project: { tenantId: input.tenantId },
    },
    select: {
      id: true,
      name: true,
      billingDraftInvoiceId: true,
      project: {
        select: {
          id: true,
          name: true,
          clientId: true,
          client: { select: { id: true, name: true } },
        },
      },
    },
  })
  if (!milestone) return null

  const resolvedCustomerId =
    input.customerId?.trim() ||
    milestone.project.clientId ||
    milestone.project.client?.id ||
    null

  let customerName = milestone.project.client?.name ?? null
  if (resolvedCustomerId && resolvedCustomerId !== milestone.project.client?.id) {
    const contact = await db.contact.findFirst({
      where: { id: resolvedCustomerId, tenantId: input.tenantId },
      select: { name: true },
    })
    customerName = contact?.name ?? customerName
  }

  const draftId = milestone.billingDraftInvoiceId
  return {
    projectId: milestone.project.id,
    projectName: milestone.project.name,
    milestoneId: milestone.id,
    milestoneName: milestone.name,
    customerId: resolvedCustomerId,
    customerName,
    notesSuggestion: `Invoice for project "${milestone.project.name}" — milestone "${milestone.name}" (Projects handoff).`,
    billingDraftInvoiceId: draftId,
    redirectToEdit: Boolean(draftId),
  }
}
