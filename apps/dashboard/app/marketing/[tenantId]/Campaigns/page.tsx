import { redirect } from 'next/navigation'

export default async function MarketingCampaignsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  redirect(`/marketing/${tenantId}/History`)
}

