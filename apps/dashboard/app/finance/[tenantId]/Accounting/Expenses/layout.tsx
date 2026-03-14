'use client'

// No layout needed - parent Accounting layout already provides ModuleTopBar
// This prevents double header menus
export default function FinanceExpensesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
