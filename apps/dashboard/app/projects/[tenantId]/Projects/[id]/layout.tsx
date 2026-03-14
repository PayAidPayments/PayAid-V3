'use client'

/** Shell is provided by app/projects/[tenantId]/Projects/layout.tsx — avoid dual header. */
export default function ProjectDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
