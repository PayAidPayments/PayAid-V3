/**
 * Single source of truth for CRM module top bar and "More" (3-dots) menu.
 * Use this in every CRM layout so the menu stays consistent across all pages.
 *
 * Max 10 items: Home, Prospects, Contacts, Pipeline, Activities,
 * Tasks, CPQ, Automation, Revenue IQ (M1 funnel/velocity/next actions), Dialer.
 * Legacy Phase 1A metrics: `/crm/{tenant}/Metrics` (linked from Revenue IQ page).
 */

export interface CRMTopBarItem {
  name: string
  href: string
  icon?: string
}

export function getCRMTopBarItems(tenantId: string): CRMTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/crm/${tenantId}`
  return [
    { name: 'Home', href: `${base}/Home` },
    { name: 'Prospects', href: `${base}/Leads` },
    { name: 'Contacts', href: `${base}/Contacts` },
    { name: 'Pipeline', href: `${base}/Deals` },
    { name: 'Activities', href: `${base}/Activities` },
    { name: 'Tasks', href: `${base}/Tasks` },
    { name: 'CPQ', href: `${base}/CPQ` },
    { name: 'Automation', href: `${base}/SalesAutomation` },
    { name: 'Revenue IQ', href: `${base}/Revenue-Intelligence` },
    { name: 'Dialer', href: `${base}/Dialer` },
  ]
}
