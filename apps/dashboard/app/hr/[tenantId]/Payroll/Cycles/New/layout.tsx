'use client'

/** Shell is provided by app/hr/[tenantId]/layout.tsx — avoid dual header. */
export default function HRPayrollCyclesNewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
