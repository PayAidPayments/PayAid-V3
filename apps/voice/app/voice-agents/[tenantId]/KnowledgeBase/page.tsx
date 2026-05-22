import { redirect } from 'next/navigation'

export default async function VoiceAgentsKnowledgeBaseAlias({
  params,
}: {
  params: Promise<{ tenantId: string }>
}) {
  const { tenantId } = await params
  redirect(`/voice-agents/${tenantId}/studio`)
}
