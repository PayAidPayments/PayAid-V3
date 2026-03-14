/**
 * Phase 4: ISR for HR segment – revalidate list/dashboard data every 60s.
 */
export const revalidate = 60

export default function HRRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
