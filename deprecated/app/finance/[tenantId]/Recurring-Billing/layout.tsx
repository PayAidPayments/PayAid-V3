'use client'

/** Shell is provided by app/finance/[tenantId]/layout.tsx — avoid dual header. */
export default function FinanceRecurringBillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
