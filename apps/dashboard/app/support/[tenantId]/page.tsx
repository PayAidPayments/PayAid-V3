import { redirect } from 'next/navigation'

interface PageProps {
  params: Promise<{ tenantId: string }>
}

export default async function SupportTenantIndexPage({ params }: PageProps) {
  const { tenantId } = await params
  redirect(`/support/${tenantId}/Home`)
}
