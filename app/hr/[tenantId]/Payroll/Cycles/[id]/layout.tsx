'use client'

/** Shell is provided by app/hr/[tenantId]/layout.tsx — avoid dual header. */
export default function HRPayrollCyclesIdLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
