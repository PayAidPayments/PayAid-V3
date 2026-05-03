/**
 * Single source of truth for Inventory module top bar.
 * Used in app/inventory/[tenantId]/layout.tsx.
 *
 * Added: Stock Alerts, Suppliers. Reports → Analytics label.
 */

export interface InventoryTopBarItem {
  name: string
  href: string
  icon?: string
}

export function getInventoryTopBarItems(tenantId: string): InventoryTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/inventory/${tenantId}`
  return [
    { name: 'Home', href: `${base}/Home` },
    { name: 'Products', href: `${base}/Products` },
    { name: 'Warehouses', href: `${base}/Warehouses` },
    { name: 'Stock Movements', href: `${base}/StockMovements` },
    { name: 'Stock Alerts', href: `${base}/Stock-Alerts` },
    { name: 'Suppliers', href: `${base}/Suppliers` },
    { name: 'Analytics', href: `${base}/Reports` },
  ]
}
