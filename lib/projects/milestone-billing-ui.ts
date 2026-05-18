import { milestoneMetBillingHandoff } from '@/lib/api/projects/milestone-billing-handoff'

export type MilestoneBillingRow = {
  id: string
  name: string
  status: string
  billingTrigger: string | null
  approvalRequired: boolean
  approvedAt?: string | Date | null
  billingDraftInvoiceId?: string | null
  dueDate?: string | Date | null
}

export function milestoneBillingStatusLabel(m: MilestoneBillingRow): string {
  const bt = (m.billingTrigger || 'NONE').toUpperCase()
  if (bt === 'NONE') return 'No billing trigger'
  if ((m.status || '').toUpperCase() !== 'MET') return 'Awaiting milestone Met'
  if (bt === 'ON_APPROVE' && m.approvalRequired && !m.approvedAt) {
    return 'Awaiting billing approval'
  }
  if (m.billingDraftInvoiceId) return 'Draft invoice ready'
  return 'Ready for Finance handoff'
}

export function milestoneEligibleForBillingHandoff(
  m: MilestoneBillingRow,
  project: { id: string; name: string }
) {
  return milestoneMetBillingHandoff(
    {
      id: m.id,
      name: m.name,
      status: m.status,
      billingTrigger: m.billingTrigger,
      approvalRequired: m.approvalRequired,
      approvedAt: m.approvedAt,
    },
    project
  )
}

export function canMarkMilestoneMet(m: MilestoneBillingRow): boolean {
  return (m.status || '').toUpperCase() !== 'MET'
}

export function canApproveMilestoneBilling(m: MilestoneBillingRow): boolean {
  return (
    (m.billingTrigger || '').toUpperCase() === 'ON_APPROVE' &&
    m.approvalRequired &&
    (m.status || '').toUpperCase() === 'MET' &&
    !m.approvedAt
  )
}
