'use client'

// No layout needed - parent Vendors layout already provides ModuleTopBar
// This prevents double header menus
export default function FinanceVendorsNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
