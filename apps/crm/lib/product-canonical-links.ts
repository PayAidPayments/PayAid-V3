import { buildCanonicalModuleUrl } from '@/lib/utils/canonical-module-url'

/** Open Projects create with CRM handoff prefill. */
export function projectsNewHandoffUrl(
  tenantRouteKey: string,
  params: { contactId?: string; dealId?: string } = {}
): string {
  const q = new URLSearchParams({ source: 'crm' })
  if (params.contactId) q.set('contactId', params.contactId)
  if (params.dealId) q.set('dealId', params.dealId)
  return buildCanonicalModuleUrl(
    'projects',
    `/projects/${tenantRouteKey}/Projects/new?${q.toString()}`
  )
}
