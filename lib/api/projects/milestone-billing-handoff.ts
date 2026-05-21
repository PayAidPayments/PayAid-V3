/** Workflow D: MET + billingTrigger ⇒ audit + optional Finance draft (still editable in Finance). */

export type MilestoneBillingHandoffPayload = {
  trigger: 'ON_COMPLETE' | 'ON_APPROVE'
  milestoneId: string
  milestoneName: string
  projectId: string
  projectName: string
  /** Populated when Finance is licensed and draft creation succeeds. */
  invoiceDraftId?: string
}

/**
 * ON_COMPLETE: when milestone is MET.
 * ON_APPROVE: when MET and (`!approvalRequired` OR `approvedAt` is set — gate lifted).
 */
export function milestoneMetBillingHandoff(
  milestone: {
    id: string
    name: string
    status: string
    billingTrigger: string | null
    approvalRequired: boolean
    approvedAt?: Date | string | null
  },
  project: { id: string; name: string },
): MilestoneBillingHandoffPayload | null {
  if ((milestone.status || '').toUpperCase() !== 'MET') return null
  const bt = milestone.billingTrigger
  const approvedOk = milestone.approvedAt != null

  if (bt === 'ON_COMPLETE') {
    return {
      trigger: 'ON_COMPLETE',
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      projectId: project.id,
      projectName: project.name,
    }
  }
  if (bt === 'ON_APPROVE') {
    if (milestone.approvalRequired) {
      if (!approvedOk) return null
      return {
        trigger: 'ON_APPROVE',
        milestoneId: milestone.id,
        milestoneName: milestone.name,
        projectId: project.id,
        projectName: project.name,
      }
    }
    return {
      trigger: 'ON_APPROVE',
      milestoneId: milestone.id,
      milestoneName: milestone.name,
      projectId: project.id,
      projectName: project.name,
    }
  }
  return null
}

export function auditSummaryForMilestoneBillingHandoff(
  handoff: MilestoneBillingHandoffPayload,
  opts?: { approvalRequired?: boolean },
): string {
  if (handoff.trigger === 'ON_COMPLETE') {
    return `Billing handoff: milestone "${handoff.milestoneName}" met (billingTrigger ON_COMPLETE) — project "${handoff.projectName}"`
  }
  const gated = opts?.approvalRequired
  if (gated) {
    return `Billing handoff: milestone "${handoff.milestoneName}" billing-approved while MET (billingTrigger ON_APPROVE) — project "${handoff.projectName}"`
  }
  return `Billing handoff: milestone "${handoff.milestoneName}" met (billingTrigger ON_APPROVE; no approval gate) — project "${handoff.projectName}"`
}
