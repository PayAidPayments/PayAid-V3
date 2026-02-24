/**
 * Single source of truth for CRM module top bar and "More" (3-dots) menu.
 * Use this in every CRM layout so the menu stays consistent across all pages
 * (Home, Agents, Deals, Contacts, etc.).
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
    { name: 'Agents', href: `${base}/Agents` },
    { name: 'Churn', href: `${base}/Churn` },
    { name: 'Metrics', href: `${base}/Metrics` },
    { name: 'Contacts', href: `${base}/Contacts` },
    { name: 'Customers', href: `${base}/AllPeople?stage=customer` },
    { name: 'Deals', href: `${base}/Deals` },
    { name: 'All People', href: `${base}/AllPeople` },
    { name: 'Tasks', href: `${base}/Tasks` },
    { name: 'Meetings', href: `${base}/Meetings` },
    { name: 'CPQ', href: `${base}/CPQ` },
    { name: 'Sales Automation', href: `${base}/SalesAutomation` },
    { name: 'Sales Enablement', href: `${base}/SalesEnablement` },
    { name: 'Dialer', href: `${base}/Dialer` },
    { name: 'Customer Success', href: `${base}/CustomerSuccess` },
    { name: 'Visitors', href: `${base}/Visitors` },
    { name: 'Reports', href: `${base}/Reports` },
  ]
}
