import { redirect } from 'next/navigation'

export default async function MarketingChannelsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  redirect(`/marketing/${tenantId}/Social-Media`)
}
