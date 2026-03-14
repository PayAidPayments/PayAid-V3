/**
 * PayAid Social – WhatsApp connector (WAHA self-hosted).
 * Uses WAHA HTTP API for sending messages/images. No third-party brand names in UI.
 */

export interface MarketingPostForDispatch {
  id: string
  tenantId: string
  channel: string
  content: string
  mediaIds: string[]
  segmentId?: string | null
  metadata?: Record<string, unknown>
}

export interface WAHAConfig {
  baseUrl: string
  /** Resolve contact phone numbers from segmentId (e.g. via Segments API). */
  getContactsForSegment: (tenantId: string, segmentId: string) => Promise<{ phone: string }[]>
  /** Get public URL for a media id (e.g. from MediaLibrary). */
  getMediaUrl: (tenantId: string, mediaId: string) => Promise<string | null>
}

/**
 * Send a marketing post to WhatsApp via WAHA.
 * Resolves target contacts from the selected segment, sends text + media to each.
 */
export async function sendWhatsAppPost(
  post: MarketingPostForDispatch,
  config: WAHAConfig
): Promise<{ sent: number; failed: number }> {
  const contacts = post.segmentId
    ? await config.getContactsForSegment(post.tenantId, post.segmentId)
    : []
  let sent = 0
  let failed = 0
  const mediaUrls: string[] = []
  for (const mediaId of post.mediaIds) {
    const url = await config.getMediaUrl(post.tenantId, mediaId)
    if (url) mediaUrls.push(url)
  }
  for (const contact of contacts) {
    try {
      const response = await fetch(`${config.baseUrl}/api/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: contact.phone,
          message: post.content,
          imageUrl: mediaUrls[0] || undefined,
        }),
      })
      if (response.ok) sent++
      else failed++
    } catch {
      failed++
    }
  }
  return { sent, failed }
}
