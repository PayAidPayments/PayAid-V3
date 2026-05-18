/** External-facing roles that typically must not see internal billing/cost rates. */
export function isProjectsClientPortalRole(roleList: string[]): boolean {
  const r = roleList.map((x) => String(x).toLowerCase())
  return r.some((x) =>
    ['client', 'customer', 'external', 'portal_client', 'client_user'].includes(x)
  )
}

/**
 * When **`true`** on **`Tenant.invoiceSettings`**, clients may receive billing/cost rate fields:
 * `{ showCostRatesToClientRoles?: true }` or nested `{ projects: { showCostRatesToClientRoles?: true } }`.
 */
export function tenantAllowsProjectsCostRatesForClientPortal(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') return false
  const o = settings as Record<string, unknown>
  if ('showCostRatesToClientRoles' in o && o.showCostRatesToClientRoles === true) return true
  const projects = o.projects
  if (
    projects &&
    typeof projects === 'object' &&
    (projects as Record<string, unknown>).showCostRatesToClientRoles === true
  )
    return true
  return false
}

/** §10.2 — strip **`billingRate`** / **`costRate`** (and rate-derived aggregates) for client portals unless flagged. */
export function shouldRedactProjectsCostRatesForViewer(
  roleList: string[],
  tenantInvoiceSettings: unknown,
): boolean {
  if (!isProjectsClientPortalRole(roleList)) return false
  if (tenantAllowsProjectsCostRatesForClientPortal(tenantInvoiceSettings)) return false
  return true
}
