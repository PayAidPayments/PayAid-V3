import { redirect } from 'next/navigation'

export default async function CampaignsPageNewRedirect({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  redirect(`/marketing/${tenantId}/Campaigns`)
}
