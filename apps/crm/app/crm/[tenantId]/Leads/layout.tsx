'use client'

/** Shell is provided by app/crm/[tenantId]/layout.tsx — avoid dual header. */
export default function CRMLeadsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
