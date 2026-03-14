'use client'

/** Shell is provided by app/crm/[tenantId]/layout.tsx — avoid dual header. */
export default function CRMMeetingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
