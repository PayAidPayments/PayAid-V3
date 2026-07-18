import type { UnifiedInboxItem } from '@/lib/marketing/unified-inbox'

export type InboxReplyContext = {
  source: 'social' | 'whatsapp' | 'email'
  entityId: string
  channel: string
  actorName?: string | null
  preview?: string | null
  draftId?: string
}

export function parseUnifiedInboxItemId(id: string): {
  source: 'social' | 'whatsapp' | 'email'
  entityId: string
} {
  if (id.startsWith('social-')) return { source: 'social', entityId: id.slice(7) }
  if (id.startsWith('wa-')) return { source: 'whatsapp', entityId: id.slice(3) }
  if (id.startsWith('email-')) return { source: 'email', entityId: id.slice(6) }
  return { source: 'social', entityId: id }
}

export function studioChannelForInboxItem(item: Pick<UnifiedInboxItem, 'source' | 'channel'>): string {
  if (item.source === 'whatsapp') return 'whatsapp'
  if (item.source === 'email') return 'email'
  const p = item.channel.toLowerCase()
  if (p.includes('instagram')) return 'instagram'
  if (p.includes('facebook')) return 'facebook'
  if (p.includes('linkedin')) return 'linkedin'
  if (p.includes('twitter') || p.includes('x.com')) return 'linkedin'
  if (p.includes('youtube')) return 'youtube'
  return 'linkedin'
}

export function buildInboxReplyQuote(actorName: string | null | undefined, preview: string | null | undefined) {
  const who = actorName?.trim() || 'contact'
  const snippet = (preview || '').trim().slice(0, 400)
  if (!snippet) return `Reply to ${who}:\n\n`
  return `Reply to ${who}:\n\n> ${snippet.replace(/\n/g, '\n> ')}\n\n`
}

export function buildInboxReplyStudioHref(
  tenantId: string,
  item: UnifiedInboxItem,
  extra?: { draftId?: string },
): string {
  const { source, entityId } = parseUnifiedInboxItemId(item.id)
  const studioChannel = studioChannelForInboxItem(item)
  const mode = source === 'whatsapp' || source === 'email' ? 'direct' : 'social'
  const params = new URLSearchParams({
    replySource: source,
    replyTo: entityId,
    channel: studioChannel,
    mode,
  })
  if (item.actorName) params.set('replyToName', item.actorName)
  const quote = buildInboxReplyQuote(item.actorName, item.preview)
  if (quote.trim()) params.set('prefill', quote)
  if (extra?.draftId) params.set('draftId', extra.draftId)
  return `/marketing/${tenantId}/Studio?${params.toString()}`
}
