'use client'

// No layout needed - parent Accounting/Expenses layout already provides ModuleTopBar
// This prevents double header menus
export default function FinanceExpensesReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
