import { redirect } from 'next/navigation'

/**
 * HR "Documents & Forms" is implemented as Payslips.
 * Redirect /hr/[tenantId]/Documents → /hr/[tenantId]/Payslips so route-health and links stay green.
 */
export default async function HRDocumentsRedirect({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  redirect(`/hr/${tenantId}/Payslips`)
}
