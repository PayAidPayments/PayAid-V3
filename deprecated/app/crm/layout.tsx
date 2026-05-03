/**
 * Phase 3: ISR for CRM segment – revalidate list/dashboard data every 60s.
 * Server layout; nested [tenantId]/layout is client (shell).
 */
export const revalidate = 60

export default function CRMRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
