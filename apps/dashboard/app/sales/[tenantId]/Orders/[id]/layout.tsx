'use client'

/** Shell is provided by app/sales/[tenantId]/Orders/layout.tsx — avoid dual header. */
export default function OrderDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
