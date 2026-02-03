'use client'

// No layout needed - parent Purchase-Orders layout already provides ModuleTopBar
// This prevents double header menus
export default function FinancePurchaseOrdersNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
