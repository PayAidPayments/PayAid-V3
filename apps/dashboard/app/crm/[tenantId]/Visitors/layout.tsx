'use client'

/** Shell is provided by app/crm/[tenantId]/layout.tsx — avoid dual header. */
export default function CRMVisitorsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
