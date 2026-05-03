import 'server-only'

/** Human-readable title for outbound / queued marketing or CRM email jobs. */
export function titleForEmailSendJob(subject: string | null | undefined, status: string | null | undefined): string {
  const st = (status || '').toLowerCase()
  const prefix =
    st === 'sent'
      ? 'Email sent'
      : st === 'failed'
        ? 'Email failed'
        : st === 'processing'
          ? 'Email sending'
          : st === 'pending'
            ? 'Email queued'
            : 'Email'
  const s = subject?.trim()
  return s ? `${prefix}: ${s}` : prefix
}

/** Human-readable title for pixel/link tracking events (opens, clicks, etc.). */
export function titleForEmailTrackingEvent(eventType: string | null | undefined): string {
  const t = (eventType || '').toLowerCase()
  if (t === 'open') return 'Email opened'
  if (t === 'click') return 'Email link clicked'
  if (t === 'bounce') return 'Email bounced'
  if (t === 'complaint') return 'Spam complaint'
  if (t === 'unsubscribe') return 'Unsubscribed'
  return `Email · ${eventType || 'event'}`
}

const DEFAULT_EMAIL_PREVIEW_LEN = 220

function truncatePreview(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s
  return `${s.slice(0, Math.max(0, maxLen - 1))}…`
}

/**
 * Plain-text preview for `EmailSendJob` timeline rows: prefer `textBody`, else strip tags from
 * `htmlBody` (best-effort, not a full HTML parser).
 */
export function previewTextForEmailSendJob(
  htmlBody: string | null | undefined,
  textBody: string | null | undefined,
  maxLen: number = DEFAULT_EMAIL_PREVIEW_LEN
): string | null {
  const plain = textBody?.trim()
  if (plain) return truncatePreview(plain, maxLen)
  const raw = htmlBody?.trim()
  if (!raw) return null
  const stripped = raw
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!stripped) return null
  return truncatePreview(stripped, maxLen)
}

/** Timeline `description` for an email send job: error, then body preview, then To: line. */
export function descriptionLineForEmailSendJob(job: {
  error?: string | null
  toEmails?: string[]
  htmlBody?: string | null
  textBody?: string | null
}): string | null {
  const err = job.error?.trim()
  if (err) return err
  const preview = previewTextForEmailSendJob(job.htmlBody, job.textBody)
  if (preview) return preview
  if (job.toEmails?.length) return `To: ${job.toEmails.slice(0, 4).join(', ')}`
  return null
}

function asPlainObject(v: unknown): Record<string, unknown> | null {
  if (v == null) return null
  if (typeof v === 'string') {
    const t = v.trim()
    if (!t.startsWith('{') && !t.startsWith('[')) return null
    try {
      const parsed = JSON.parse(t) as unknown
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>
    } catch {
      return null
    }
    return null
  }
  if (typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>
  return null
}

function firstNonEmptyString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim()
  }
  return null
}

/**
 * Plain-text description for `EmailTrackingEvent` rows from `eventData` JSON + optional envelope
 * fields (best-effort; shapes vary by producer).
 */
export function descriptionLineForEmailTrackingEvent(
  eventType: string | null | undefined,
  eventData: unknown,
  opts?: {
    ipAddress?: string | null
    referer?: string | null
    userAgent?: string | null
    messageId?: string | null
  }
): string | null {
  const t = (eventType || '').toLowerCase()
  const data = asPlainObject(eventData)
  const parts: string[] = []

  if (data) {
    const url = firstNonEmptyString(
      data.url,
      data.linkUrl,
      data.href,
      data.clickedUrl,
      data.targetUrl,
      data.link
    )
    if (url && (t === 'click' || t.includes('click'))) {
      parts.push(`Link: ${truncatePreview(url, 140)}`)
    }

    const diag = firstNonEmptyString(
      data.reason,
      data.bounceReason,
      data.diagnostic,
      data.error,
      data.description,
      data.message,
      data.detail
    )
    if (diag && (t === 'bounce' || t === 'complaint' || t === 'unsubscribe')) {
      parts.push(truncatePreview(diag, 180))
    }

    if (t === 'open') {
      const loc = firstNonEmptyString(data.location, data.country, data.region, data.city)
      if (loc) parts.push(loc)
      const client = firstNonEmptyString(data.client, data.emailClient, data.mailer)
      if (client) parts.push(truncatePreview(client, 90))
    }

    if (parts.length === 0) {
      const generic = firstNonEmptyString(data.body, data.snippet, data.text, data.note)
      if (generic) parts.push(truncatePreview(generic, 160))
    }
  }

  const referer = opts?.referer?.trim()
  if (referer && (t === 'click' || t.includes('click')) && !parts.some((p) => p.includes(referer.slice(0, 20)))) {
    parts.push(`Referer: ${truncatePreview(referer, 100)}`)
  }

  const ua = opts?.userAgent?.trim()
  if (ua && t === 'open' && parts.length < 4) {
    parts.push(`UA: ${truncatePreview(ua, 100)}`)
  }

  const ip = opts?.ipAddress?.trim()
  if (ip) parts.push(`IP: ${ip}`)

  const mid = opts?.messageId?.trim()
  if (mid && parts.length === 0) parts.push(`Message: ${truncatePreview(mid, 96)}`)

  if (!parts.length) return null
  return parts.join(' · ')
}
