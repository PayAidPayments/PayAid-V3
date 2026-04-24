import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ tenantId: string }>
}

export default async function LogoGeneratorLogosRedirectPage({ params }: Props) {
  const { tenantId } = await params
  redirect(`/logo-generator/${tenantId}/Home`)
}
