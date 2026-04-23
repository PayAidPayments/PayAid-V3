import { redirect } from 'next/navigation'

export default function VoiceAgentsSettingsAlias({
  params,
}: {
  params: { tenantId: string }
}) {
  redirect(`/voice-agents/${params.tenantId}/studio`)
}
