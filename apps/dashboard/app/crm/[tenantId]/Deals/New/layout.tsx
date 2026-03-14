'use client'

// No layout needed - parent Deals layout already provides ModuleTopBar
// This prevents double header menus
export default function NewDealLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
