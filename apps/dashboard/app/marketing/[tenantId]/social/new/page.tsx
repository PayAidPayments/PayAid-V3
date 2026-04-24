import { redirect } from 'next/navigation'

/** Legacy route kept for backwards compatibility; use Compose. */
export default async function MarketingSocialNewPage({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  redirect(`/marketing/${tenantId}/Studio?legacyRedirect=1`)
}
