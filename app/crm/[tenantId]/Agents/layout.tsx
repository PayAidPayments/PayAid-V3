'use client'

/** Shell is provided by app/crm/[tenantId]/layout.tsx — avoid dual header. */
export default function CRMAgentsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
