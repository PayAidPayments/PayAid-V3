/**
 * Single source of truth for CRM module top bar and "More" (3-dots) menu.
 * Use this in every CRM layout so the menu stays consistent across all pages.
 *
 * Restructured to max 10 items: Home, Prospects, Contacts, Pipeline, Activities,
 * CPQ, Automation, Intelligence, Dialer, Agents.
 * All People/Customers = tabs inside Contacts. Tasks+Meetings = Activities. Metrics+Churn+Visitors+Reports = Intelligence.
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
    { name: 'CPQ', href: `${base}/CPQ` },
    { name: 'Automation', href: `${base}/SalesAutomation` },
    { name: 'Intelligence', href: `${base}/Metrics` },
    { name: 'Dialer', href: `${base}/Dialer` },
    { name: 'Agents', href: `${base}/Agents` },
  ]
}
