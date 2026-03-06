/**
 * Single source of truth for Sales module top bar.
 * Used in app/sales/[tenantId]/layout.tsx.
 */

export interface SalesTopBarItem {
  name: string
  href: string
  icon?: string
}

export function getSalesTopBarItems(tenantId: string): SalesTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/sales/${tenantId}`
  return [
    { name: 'Home', href: `${base}/Home` },
    { name: 'Landing Pages', href: `${base}/Landing-Pages` },
    { name: 'Checkout Pages', href: `${base}/Checkout-Pages` },
    { name: 'Orders', href: `${base}/Orders` },
  ]
}
