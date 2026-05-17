/** Default GST % on milestone handoff time lines when tenant settings omit it. */
export const MILESTONE_HANDOFF_DEFAULT_GST_PCT = 18

/**
 * Tenant `invoiceSettings` JSON may include:
 * ```json
 * {
 *   "projectsMilestoneHandoff": {
 *     "gstRatePercent": 18,
 *     "defaultInterState": false
 *   }
 * }
 * ```
 */
export function resolveMilestoneHandoffGstOpts(
  invoiceSettings: unknown,
  projectBillingIsInterState: boolean | null | undefined
): { gstRatePercent: number; isInterState: boolean } {
  let tenantGst = MILESTONE_HANDOFF_DEFAULT_GST_PCT
  let tenantInterDefault = false

  if (invoiceSettings && typeof invoiceSettings === 'object') {
    const o = invoiceSettings as Record<string, unknown>
    const p = o.projectsMilestoneHandoff
    if (p && typeof p === 'object') {
      const block = p as Record<string, unknown>
      const r = block.gstRatePercent
      if (typeof r === 'number' && Number.isFinite(r) && r >= 0 && r <= 100) {
        tenantGst = r
      }
      if (block.defaultInterState === true) tenantInterDefault = true
    }
  }

  const isInterState =
    projectBillingIsInterState === null || projectBillingIsInterState === undefined
      ? tenantInterDefault
      : projectBillingIsInterState

  return { gstRatePercent: tenantGst, isInterState }
}
