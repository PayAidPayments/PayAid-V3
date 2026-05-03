'use client'

/** Shell is provided by app/crm/[tenantId]/layout.tsx — avoid dual header. */
export default function CRMTasksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
