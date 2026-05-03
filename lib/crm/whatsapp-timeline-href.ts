function asHttpUrl(raw: string | null | undefined): string | null {
  const v = (raw || '').trim()
  if (!v) return null
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  return null
}

/** Deep links for WhatsApp timeline rows. Prefer media URL, then inbox conversation. */
export function hrefForWhatsappTimelineDetail(
  conversationId: string | null | undefined,
  mediaUrl?: string | null | undefined
): string | null {
  const media = asHttpUrl(mediaUrl)
  if (media) return media
  const id = (conversationId || '').trim()
  if (!id) return null
  return `/dashboard/whatsapp/inbox?conversationId=${encodeURIComponent(id)}`
}
