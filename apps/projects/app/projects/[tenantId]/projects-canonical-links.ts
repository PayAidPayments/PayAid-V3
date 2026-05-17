import { buildCanonicalModuleUrl } from '@/lib/utils/canonical-module-url'

/** CRM contact detail — uses NEXT_PUBLIC_CRM_APP_URL when set. */
export function crmContactUrl(tenantRouteKey: string, contactId: string): string {
  return buildCanonicalModuleUrl('crm', `/crm/${tenantRouteKey}/Contacts/${contactId}`)
}

/** CRM deal detail — uses NEXT_PUBLIC_CRM_APP_URL when set. */
export function crmDealUrl(tenantRouteKey: string, dealId: string): string {
  return buildCanonicalModuleUrl('crm', `/crm/${tenantRouteKey}/Deals/${dealId}`)
}

export type ProjectsNewHandoffParams = {
  contactId?: string
  dealId?: string
  source?: 'crm'
}

/** Projects create with optional CRM handoff query params. */
export function projectsNewHandoffUrl(
  tenantRouteKey: string,
  params: ProjectsNewHandoffParams = {}
): string {
  const q = new URLSearchParams()
  if (params.source) q.set('source', params.source)
  if (params.contactId) q.set('contactId', params.contactId)
  if (params.dealId) q.set('dealId', params.dealId)
  const query = q.toString()
  const path = `/projects/${tenantRouteKey}/Projects/new${query ? `?${query}` : ''}`
  return buildCanonicalModuleUrl('projects', path)
}

export type FinanceMilestoneHandoffParams = {
  customerId?: string
  projectId: string
  milestoneId: string
  source?: 'projects'
}

/** Finance invoice create prefilled from a project milestone. */
export function financeInvoiceNewFromMilestoneUrl(
  tenantRouteKey: string,
  params: FinanceMilestoneHandoffParams
): string {
  const q = new URLSearchParams({
    projectId: params.projectId,
    milestoneId: params.milestoneId,
    source: params.source ?? 'projects',
  })
  if (params.customerId) q.set('customerId', params.customerId)
  return buildCanonicalModuleUrl(
    'finance',
    `/finance/${tenantRouteKey}/Invoices/new?${q.toString()}`
  )
}

/** Open an existing Finance invoice draft (milestone handoff). */
export function financeInvoiceEditUrl(tenantRouteKey: string, invoiceId: string): string {
  return buildCanonicalModuleUrl(
    'finance',
    `/finance/${tenantRouteKey}/Invoices/${invoiceId}/Edit`
  )
}
