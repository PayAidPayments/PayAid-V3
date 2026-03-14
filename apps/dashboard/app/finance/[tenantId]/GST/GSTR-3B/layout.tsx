'use client'

// No layout needed - parent GST layout already provides ModuleTopBar
// This prevents double header menus
export default function FinanceGSTR3BLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
