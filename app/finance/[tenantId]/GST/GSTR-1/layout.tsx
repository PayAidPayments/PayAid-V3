'use client'

// No layout needed - parent GST layout already provides ModuleTopBar
// This prevents double header menus
export default function FinanceGSTR1Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
