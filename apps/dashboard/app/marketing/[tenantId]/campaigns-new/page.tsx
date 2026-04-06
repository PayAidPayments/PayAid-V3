import { redirect } from 'next/navigation'

export default function CampaignsPageNewRedirect({
  params,
}: {
  params: { tenantId: string }
}) {
  redirect(`/marketing/${params.tenantId}/Campaigns`)
}
