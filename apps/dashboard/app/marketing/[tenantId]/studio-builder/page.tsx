import { redirect } from 'next/navigation'

export default async function MarketingStudioBuilderPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  redirect(`/marketing/${tenantId}/Studio?legacyRedirect=1`)
}
