import { redirect } from 'next/navigation'

export default function VoiceAgentsKnowledgeBaseAlias({
  params,
}: {
  params: { tenantId: string }
}) {
  redirect(`/voice-agents/${params.tenantId}/studio`)
}
