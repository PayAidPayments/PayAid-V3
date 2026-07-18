import { MarketingStudioForm } from '@/components/marketing/MarketingStudioForm'
import type { StudioWorkspaceMode } from '@/lib/marketing/studio-workspace'

interface PageProps {
  params: Promise<{ tenantId: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function spValue(v: string | string[] | undefined) {
  return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined
}

export default async function MarketingStudioPage({ params, searchParams }: PageProps) {
  const { tenantId } = await params
  const sp = await searchParams

  const mode = spValue(sp.mode)
  const workspaceMode: StudioWorkspaceMode = mode === 'direct' ? 'direct' : 'social'

  const replySource = spValue(sp.replySource)
  const inboxReply =
    replySource === 'social' || replySource === 'whatsapp' || replySource === 'email'
      ? {
          source: replySource,
          entityId: spValue(sp.replyTo) || '',
          channel: spValue(sp.channel) || '',
          actorName: spValue(sp.replyToName),
          preview: spValue(sp.prefill),
          draftId: spValue(sp.draftId),
        }
      : undefined

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">Compose</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {inboxReply?.draftId ? 'Draft reply from unified inbox' : 'Campaign & social studio'}
        </p>
      </div>
      <MarketingStudioForm
        tenantId={tenantId}
        workspaceMode={workspaceMode}
        inboxReply={inboxReply}
      />
    </div>
  )
}
