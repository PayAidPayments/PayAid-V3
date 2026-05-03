/**
 * Single source of truth for Finance module top bar.
 * Used in app/finance/[tenantId]/layout.tsx.
 *
 * Restructure: Home, Invoices (Recurring as tab), Payments, Expenses, Purchase Orders (Vendors as tab),
 * Accounting, GST & TDS (Tax), E-Invoicing, Bank, CA Assistant.
 */

export interface FinanceTopBarItem {
  name: string
  href: string
  icon?: string
}

export function getFinanceTopBarItems(tenantId: string): FinanceTopBarItem[] {
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return []
  }
  const base = `/finance/${tenantId}`
  return [
    { name: 'Home', href: `${base}/Home` },
    { name: 'Invoices', href: `${base}/Invoices` },
    { name: 'Payments', href: `${base}/Payments` },
    { name: 'Expenses', href: `${base}/Accounting/Expenses` },
    { name: 'Purchase Orders', href: `${base}/Purchase-Orders` },
    { name: 'Accounting', href: `${base}/Accounting` },
    { name: 'GST & TDS', href: `${base}/Tax` },
    { name: 'E-Invoicing', href: `${base}/E-Invoicing` },
    { name: 'Bank', href: `${base}/Bank-Reconciliation` },
    { name: 'CA Assistant', href: `${base}/ca-assistant` },
  ]
}
