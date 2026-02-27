'use client'

/** Shell is provided by app/crm/[tenantId]/layout.tsx — avoid dual header. */
export default function CRMHomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
