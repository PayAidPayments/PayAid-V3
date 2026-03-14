'use client'

/** Shell is provided by app/projects/[tenantId]/Tasks/layout.tsx — avoid dual header. */
export default function NewTaskLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
