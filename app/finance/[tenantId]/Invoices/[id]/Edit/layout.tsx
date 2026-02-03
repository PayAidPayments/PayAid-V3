'use client'

// No layout needed - parent Invoices layout already provides ModuleTopBar
// This prevents double header menus
export default function EditInvoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
