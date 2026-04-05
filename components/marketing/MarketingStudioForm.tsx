'use client'

import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { saveStudioDraftToLibrary } from '@/lib/marketing/studio-actions'
import { useAuthStore } from '@/lib/stores/auth'

const GOALS = [
  { id: 'awareness', label: 'Awareness' },
  { id: 'leads', label: 'Leads' },
  { id: 'sales', label: 'Sales' },
] as const

const AUDIENCES = [
  { id: 'all_contacts', label: 'All Contacts' },
  { id: 'new_leads', label: 'New Leads' },
  { id: 'high_value_customers', label: 'High-value customers' },
] as const

const CHANNEL_OPTIONS = [
  { id: 'email', label: 'Email' },
  { id: 'sms', label: 'SMS' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
] as const

/** Where the creative will be used — steers composition and aspect hints for image generation. */
const IMAGE_USE_CASES = [
  { id: 'social_feed', label: 'Social feed post (Facebook / LinkedIn / Instagram)' },
  { id: 'story_reel', label: 'Story / Reel / short vertical video cover' },
  { id: 'email_hero', label: 'Email hero or banner' },
  { id: 'paid_ad', label: 'Paid ad / sponsored placement' },
  { id: 'blog_web', label: 'Blog, website, or landing page' },
  { id: 'print', label: 'Print, poster, or offline' },
  { id: 'other', label: 'Other' },
] as const

type ImageUseCaseId = (typeof IMAGE_USE_CASES)[number]['id']

/** Quick-start templates for image fields (user can edit after applying). */
const IMAGE_PRESETS: Array<{
  id: string
  label: string
  useCase?: ImageUseCaseId
  purposeNote?: string
  promptTemplate?: string
}> = [
  { id: 'none', label: 'Custom (no preset)' },
  {
    id: 'ecom_product',
    label: 'E‑commerce product hero',
    useCase: 'social_feed',
    purposeNote: 'Product-focused social / catalog ad',
    promptTemplate:
      'Single hero product on a clean neutral background, soft studio lighting, subtle shadow, minimal props, premium retail look, no overlaid text or watermarks.',
  },
  {
    id: 'founder_quote',
    label: 'Founder / quote card',
    useCase: 'social_feed',
    purposeNote: 'LinkedIn-style thought leadership card',
    promptTemplate:
      'Professional portrait-style composition with generous negative space for quote text overlay later, warm trustworthy tone, office or soft abstract background, no readable small text in the image.',
  },
  {
    id: 'event_announcement',
    label: 'Event announcement',
    useCase: 'blog_web',
    purposeNote: 'Web banner or registration page header',
    promptTemplate:
      'Bold event-themed visual, clear focal point, celebratory but professional, space for headline overlay, Indian SMB audience, no illegible tiny text.',
  },
  {
    id: 'story_vertical',
    label: 'Story / Reel cover',
    useCase: 'story_reel',
    purposeNote: '9:16 vertical social story',
    promptTemplate:
      'Vertical composition, thumb-stopping center subject, high contrast, mobile-first, minimal fine print, no cluttered borders.',
  },
]

type ChannelId = (typeof CHANNEL_OPTIONS)[number]['id']
type ChannelCopy = { subject?: string; body: string }
type SavedEmailTemplate = {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent?: string | null
}

function channelLabel(channelId: string) {
  return CHANNEL_OPTIONS.find((x) => x.id === channelId)?.label ?? channelId
}

function buildDigestFromCopy(copy: Record<string, ChannelCopy>): string {
  const entries = Object.entries(copy)
  if (!entries.length) return ''
  return entries
    .map(([ch, c]) => `[${channelLabel(ch)}] ${(c.body || '').replace(/\s+/g, ' ').trim().slice(0, 500)}`)
    .join('\n')
    .slice(0, 3500)
}

function isValidHttpUrl(raw: string): boolean {
  const s = (raw || '').trim()
  if (!s) return true // empty is allowed
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

function resolveLinkTokens(text: string, primaryLink: string): string {
  const url = (primaryLink || '').trim()
  if (!url) return text
  return (text || '').replaceAll('[link]', url)
}

/** Turn relative `/generated/...` URLs into absolute so `<video src>` always resolves on the app origin. */
function resolvePlaybackUrl(url: string): string {
  const u = (url || '').trim()
  if (!u) return u
  if (/^(https?:|data:|blob:)/i.test(u)) return u
  if (typeof window !== 'undefined' && u.startsWith('/')) return `${window.location.origin}${u}`
  return u
}

/** If Primary link is set, every preview/post must show that URL when the body does not already include it. */
function ensureChannelBodyHasPrimaryLink(
  body: string,
  primaryLink: string,
  linkIsValid: boolean
): string {
  if (!linkIsValid || !primaryLink.trim()) return body
  const url = primaryLink.trim()
  const t = (body || '').trim()
  if (!t) return url
  if (t.toLowerCase().includes(url.toLowerCase())) return body
  return `${t}\n\n${url}`
}

function extractFirstJsonObject(raw: string): string | null {
  const s = raw.trim()
  const start = s.indexOf('{')
  if (start < 0) return null
  let depth = 0
  let inString = false
  let escape = false
  for (let i = start; i < s.length; i++) {
    const ch = s[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      inString = true
      continue
    }
    if (ch === '{') depth++
    if (ch === '}') depth--
    if (depth === 0) return s.slice(start, i + 1)
  }
  return null
}

function stripMarkdownFences(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '').trim()
}

function decodeJsonLikeValue(v: string): string {
  return v
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .trim()
}

function extractChannelCopyFromLooseJson(
  raw: string,
  channel: string
): { subject?: string; body?: string } | null {
  const block = raw.match(
    new RegExp(
      `\\{[\\s\\S]*?"channel"\\s*:\\s*"${channel}"[\\s\\S]*?\\}`,
      'i'
    )
  )?.[0]
  if (!block) return null
  const subject = block.match(/"subject"\s*:\s*"([\s\S]*?)"/i)?.[1]
  const body = block.match(/"body"\s*:\s*"([\s\S]*?)"/i)?.[1]
  if (!subject && !body) return null
  return {
    subject: subject ? decodeJsonLikeValue(subject) : undefined,
    body: body ? decodeJsonLikeValue(body) : undefined,
  }
}

function ensureSocialHashtags(body: string): string {
  const alreadyHasHashtag = /(^|\s)#[\p{L}\p{N}_]+/u.test(body)
  if (alreadyHasHashtag) return body.trim()
  const tags = ['#Sale', '#Offer', '#ShopNow', '#India']
  return `${body.trim()}\n\n${tags.join(' ')}`
}

function emailFooterPreviewLines(brand: string): string {
  const disclaimer =
    'This message is intended for the addressed recipient(s). If you received this by mistake, please disregard.'
  return [
    '',
    '—',
    brand,
    'Manage preferences · Unsubscribe',
    disclaimer,
  ].join('\n')
}

function clampPreviewText(text: string, maxChars: number) {
  const t = (text || '').trim()
  if (t.length <= maxChars) return { preview: t, clamped: false }
  return { preview: `${t.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`, clamped: true }
}

function SocialPostPreview({
  channel,
  body,
  brandName,
  imageUrl,
  ctaLabel,
  ctaHref,
}: {
  channel: 'facebook' | 'linkedin'
  body: string
  brandName: string
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
}) {
  const isLinkedIn = channel === 'linkedin'
  const { preview, clamped } = clampPreviewText(body, isLinkedIn ? 460 : 320)
  const initials = brandName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.slice(0, 1).toUpperCase())
    .join('')

  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/40 overflow-hidden">
      <div className="px-4 py-3 flex items-start gap-3">
        <div
          className={[
            'h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold',
            isLinkedIn ? 'bg-sky-600 text-white' : 'bg-blue-600 text-white',
          ].join(' ')}
          aria-hidden="true"
        >
          {initials || 'PA'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{brandName}</p>
            <span
              className={[
                'text-[10px] px-2 py-0.5 rounded-full border',
                isLinkedIn
                  ? 'border-sky-200 text-sky-700 bg-sky-50 dark:border-sky-900/60 dark:text-sky-300 dark:bg-sky-950/40'
                  : 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-900/60 dark:text-blue-300 dark:bg-blue-950/40',
              ].join(' ')}
            >
              {isLinkedIn ? 'LinkedIn' : 'Facebook'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Just now · {isLinkedIn ? 'Public' : '🌐'}
          </p>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">{preview || '—'}</p>
        {clamped && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isLinkedIn ? '…see more' : 'See more'}
          </p>
        )}
      </div>

      {imageUrl && (
        <div className="border-y border-slate-200/80 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center min-h-[200px] max-h-80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="w-full max-h-80 object-contain object-center" />
        </div>
      )}

      {ctaHref ? (
        <div className="px-4 py-2 border-b border-slate-200/80 dark:border-slate-800">
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className={[
              'inline-flex w-full sm:w-auto justify-center rounded-lg text-white text-sm font-semibold px-4 py-2.5',
              isLinkedIn ? 'bg-sky-600 hover:bg-sky-700' : 'bg-blue-600 hover:bg-blue-700',
            ].join(' ')}
          >
            {ctaLabel?.trim() || 'Learn more'}
          </a>
        </div>
      ) : null}

      <div className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span>{isLinkedIn ? '• 12 reactions' : '• 24 likes'}</span>
        <span>{isLinkedIn ? '3 comments' : '4 comments · 1 share'}</span>
      </div>

      <div className="px-2 py-2 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-3 gap-1 text-sm">
        {['Like', 'Comment', 'Share'].map((x) => (
          <button
            key={x}
            type="button"
            className="rounded-lg px-3 py-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900"
            title="Preview only"
          >
            {x}
          </button>
        ))}
      </div>
    </div>
  )
}

function PhoneFrame({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 dark:border-slate-800 bg-slate-900 p-2 shadow-sm">
      <div className="rounded-[22px] bg-white dark:bg-slate-950 overflow-hidden">
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-950">{children}</div>
      </div>
    </div>
  )
}

function WhatsappPreview({ brandName, body }: { brandName: string; body: string }) {
  const text = (body || '').trim() || '—'
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    <PhoneFrame title="WhatsApp">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{brandName}</div>
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/50 px-3 py-2">
          <p className="text-sm text-slate-900 dark:text-slate-50 whitespace-pre-wrap">{text}</p>
          <div className="mt-1 flex items-center justify-end gap-2 text-[10px] text-slate-500 dark:text-slate-400">
            <span>{timestamp}</span>
            <span title="Delivered" aria-label="Delivered">
              ✓✓
            </span>
          </div>
        </div>
      </div>
    </PhoneFrame>
  )
}

function SmsPreview({ brandName, body }: { brandName: string; body: string }) {
  const text = (body || '').trim() || '—'
  const count = text.length
  return (
    <PhoneFrame title="Messages (SMS)">
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{brandName}</div>
      <div className="space-y-2">
        <div className="inline-block max-w-[90%] rounded-2xl rounded-bl-md bg-slate-200 dark:bg-slate-800 px-3 py-2">
          <p className="text-sm text-slate-900 dark:text-slate-50 whitespace-pre-wrap">{text}</p>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {count} chars{count > 160 ? ' · May be split into multiple SMS' : ''}
        </p>
      </div>
    </PhoneFrame>
  )
}

function InstagramPreview({
  brandName,
  body,
  imageUrl,
  ctaLabel,
  ctaHref,
}: {
  brandName: string
  body: string
  imageUrl?: string
  ctaLabel?: string
  ctaHref?: string
}) {
  const { preview, clamped } = clampPreviewText(body, 600)
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/40 overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">{brandName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Just now</p>
        </div>
      </div>
      {imageUrl ? (
        <div className="bg-slate-100 dark:bg-slate-900 flex items-center justify-center aspect-square">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="w-full h-full object-contain object-center" />
        </div>
      ) : (
        <div className="bg-slate-100 dark:bg-slate-900 aspect-square flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          Image preview (optional)
        </div>
      )}
      <div className="px-4 py-3 space-y-2">
        <div className="text-xs text-slate-500 dark:text-slate-400">♥ 1,024 · 💬 18</div>
        <p className="text-sm text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
          <span className="font-semibold">{brandName}</span> {preview || '—'}
        </p>
        {clamped && <p className="text-xs text-slate-500 dark:text-slate-400">more</p>}
        {ctaHref ? (
          <a
            href={ctaHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            {ctaLabel?.trim() || 'Learn more'}
          </a>
        ) : null}
      </div>
    </div>
  )
}

function pickPrimaryChannel(channels: string[]): ChannelId | null {
  const preferred: ChannelId[] = ['instagram', 'facebook', 'linkedin', 'youtube', 'whatsapp', 'email', 'sms']
  for (const c of preferred) {
    if (channels.includes(c)) return c
  }
  return (channels[0] as ChannelId | undefined) ?? null
}

function aspectRatioForPrimaryChannel(primary: ChannelId | null): '1:1' | '4:5' | '9:16' | '16:9' {
  if (!primary) return '1:1'
  if (primary === 'youtube') return '16:9'
  if (primary === 'instagram') return '4:5'
  return '1:1'
}

export function MarketingStudioForm({
  tenantId,
  brandName,
  socialBranding,
  socialAccounts,
}: {
  tenantId: string
  brandName?: string
  socialBranding?: Record<string, string>
  socialAccounts?: Array<{ id: string; platform: string; accountName: string }>
}) {
  const { token } = useAuthStore()
  const resolveAuthToken = useCallback((): string | null => {
    if (token) return token
    if (typeof document !== 'undefined') {
      const m = document.cookie.match(/(?:^|;\s*)token=([^;]+)/)
      if (m?.[1]) return decodeURIComponent(m[1])
    }
    if (typeof window !== 'undefined') {
      try {
        const direct = localStorage.getItem('token') || localStorage.getItem('auth-token')
        if (direct) return direct
        const raw = localStorage.getItem('auth-storage')
        if (!raw) return null
        const parsed = JSON.parse(raw) as { state?: { token?: string | null } }
        return parsed?.state?.token ?? null
      } catch {
        return null
      }
    }
    return null
  }, [token])
  const [goal, setGoal] = useState<string>('leads')
  const [audience, setAudience] = useState<string>('all_contacts')
  const [channels, setChannels] = useState<string[]>(['email', 'facebook'])
  const [prompt, setPrompt] = useState('')
  const [primaryLink, setPrimaryLink] = useState('')
  const [ctaLabel, setCtaLabel] = useState<string>('Learn more')
  const [emailHtmlMode, setEmailHtmlMode] = useState(false)
  const [emailHtml, setEmailHtml] = useState('')
  const [templateName, setTemplateName] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [emailTemplates, setEmailTemplates] = useState<SavedEmailTemplate[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [copyByChannel, setCopyByChannel] = useState<Record<string, ChannelCopy>>({})
  const [generatedImages, setGeneratedImages] = useState<{ id: string; url: string; width?: number; height?: number }[]>([])
  const [videoJob, setVideoJob] = useState<{
    status?: 'queued' | 'completed' | 'error' | 'unconfigured'
    jobId?: string
    result?: { url?: string; durationSec?: number; width?: number; height?: number }
    message?: string
    mediaAssetId?: string
  } | null>(null)
  const [videoLoadError, setVideoLoadError] = useState<string | null>(null)
  const [videoLipSync, setVideoLipSync] = useState(false)
  const [videoScript, setVideoScript] = useState('')
  const [videoScenePlan, setVideoScenePlan] = useState('')
  const [videoVoiceoverText, setVideoVoiceoverText] = useState('')
  const [videoReferenceAudioUrl, setVideoReferenceAudioUrl] = useState('')
  const [videoShotCount, setVideoShotCount] = useState(4)
  const [videoFps, setVideoFps] = useState(24)
  const [videoSeed, setVideoSeed] = useState('')
  const [videoCapability, setVideoCapability] = useState<{
    mode: 'dynamic' | 'local-fallback' | 'unconfigured' | 'unknown'
    label: string
    details?: string
  }>({
    mode: 'unknown',
    label: 'Checking worker…',
  })

  const [loadingCopy, setLoadingCopy] = useState(false)
  const [loadingImage, setLoadingImage] = useState(false)
  const [loadingVideo, setLoadingVideo] = useState(false)
  const [loadingSubject, setLoadingSubject] = useState(false)
  // Local dev can be slow during first compile/hot reload, so keep a higher client timeout.
  const API_TIMEOUT_MS = 90_000
  /** Must be > server IMAGE_WORKER_FETCH_TIMEOUT_MS (default 900s) so the browser does not abort first. */
  const IMAGE_API_TIMEOUT_MS = 960_000

  const [imagePrompt, setImagePrompt] = useState('')
  /** Placement / use case for the creative (fed into the image API prompt). */
  const [imageUseCase, setImageUseCase] = useState<ImageUseCaseId>('social_feed')
  /** Extra context: e.g. “Diwali campaign landing page hero”, “Q4 LinkedIn sponsor”. */
  const [imagePurposeNote, setImagePurposeNote] = useState('')
  const [imagePresetId, setImagePresetId] = useState('none')
  const [imageNegativePrompt, setImageNegativePrompt] = useState('')
  const [brandColors, setBrandColors] = useState('')
  const [brandLogoUrl, setBrandLogoUrl] = useState('')
  const [lastImageProvider, setLastImageProvider] = useState<string | null>(null)
  const [studioChainBusy, setStudioChainBusy] = useState(false)
  const [imageStyle, setImageStyle] = useState<'photo' | 'illustration'>('photo')
  const [imageAspect, setImageAspect] = useState<'auto' | '1:1' | '4:5' | '9:16' | '16:9'>('auto')

  const connectedByPlatform = useMemo(() => {
    const rows = (socialAccounts || []).filter((a) => a.platform && a.accountName)
    const map: Record<string, Array<{ id: string; accountName: string }>> = {}
    for (const r of rows) {
      if (!map[r.platform]) map[r.platform] = []
      map[r.platform].push({ id: r.id, accountName: r.accountName })
    }
    return map
  }, [socialAccounts])

  const [previewAccountIdByPlatform, setPreviewAccountIdByPlatform] = useState<Record<string, string>>({})

  const getPreviewAccountName = useCallback(
    (platform: string): string | null => {
      const options = connectedByPlatform[platform] || []
      if (options.length === 0) return null
      const selectedId = previewAccountIdByPlatform[platform]
      const selected = selectedId ? options.find((o) => o.id === selectedId) : null
      return (selected || options[0])?.accountName ?? null
    },
    [connectedByPlatform, previewAccountIdByPlatform]
  )

  const getHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...(resolveAuthToken() ? { Authorization: `Bearer ${resolveAuthToken()}` } : {}),
    }),
    [resolveAuthToken]
  )

  const requireSignedIn = useCallback((): boolean => {
    if (resolveAuthToken()) return true
    setMessage('Please sign in to generate text, images, or video.')
    return false
  }, [resolveAuthToken])

  const fullPrompt = useMemo(() => {
    const g = GOALS.find((x) => x.id === goal)?.label ?? goal
    const a = AUDIENCES.find((x) => x.id === audience)?.label ?? audience
    const ch = channels.length ? channels.join(', ') : 'all channels'
    const brief = prompt.trim()
    return [`Goal: ${g}.`, `Audience: ${a}.`, `Channels: ${ch}.`, brief || 'General campaign messaging.'].join(' ')
  }, [goal, audience, channels, prompt])

  /** Short digest of generated copy for image alignment (when copy exists). */
  const copyDigestForImage = useMemo(() => buildDigestFromCopy(copyByChannel), [copyByChannel])

  const toggleChannel = (id: string) => {
    setChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const generateStudioChannelCopy = useCallback(async (): Promise<Record<string, ChannelCopy>> => {
    if (!channels.length) throw new Error('Select at least one channel.')
    if (!prompt.trim()) throw new Error('Add a brief / prompt first.')

    const ac = new AbortController()
    const timer = setTimeout(() => ac.abort(), API_TIMEOUT_MS)
    const system = [
      'You are a marketing copywriter for an Indian SMB.',
      'Generate channel-specific drafts that match the goal, audience, and brief.',
      'Return ONLY valid JSON. Do not include code fences, notes, explanations, or duplicated blocks.',
    ].join(' ')

    const channelSpec = channels.map((c) => {
      if (c === 'email') return { channel: c, fields: ['subject', 'body'] }
      if (c === 'youtube')
        return { channel: c, fields: ['body'], note: 'Write a YouTube post/community text (not a script).' }
      return { channel: c, fields: ['body'] }
    })

    const jsonPrompt = [
      fullPrompt,
      '',
      'Produce JSON with shape:',
      '{ "copies": Array<{ "channel": string, "subject"?: string, "body": string }> }',
      '',
      `Channels requested: ${JSON.stringify(channelSpec)}.`,
      'Constraints:',
      '- Keep SMS/WhatsApp concise (<= 160 chars when possible).',
      '- No hashtags unless the channel is social (facebook/instagram/linkedin/youtube).',
      '- If the channel is social, include 4-8 relevant hashtags at the end of body.',
      '- Use ₹ when mentioning prices.',
      '- If you include a link, use the literal token [link] (do not invent URLs).',
      '- If email is requested, subject MUST be present and must not be empty.',
      primaryLink.trim() && isValidHttpUrl(primaryLink)
        ? `- REQUIRED: Every channel body must include the primary URL exactly once. Prefer the token [link] on its own line at the end (it will be replaced). The URL is: ${primaryLink.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join('\n')

    try {
      const res = await fetch('/api/ai/text/generate', {
        method: 'POST',
        headers: getHeaders(),
        signal: ac.signal,
        body: JSON.stringify({ prompt: jsonPrompt, system, temperature: 0.6, maxTokens: 1200 }),
      })
      const dataText = await res.text().catch(() => '')
      let data: { text?: string; error?: string } = {}
      try {
        data = dataText ? (JSON.parse(dataText) as any) : {}
      } catch {
        data = {}
      }
      if (!res.ok) {
        throw new Error(data.error ?? (dataText ? dataText.slice(0, 200) : 'Text generation failed'))
      }
      const raw = (data.text ?? '').trim()
      const next: Record<string, ChannelCopy> = {}

      try {
        const jsonOnly = extractFirstJsonObject(raw) ?? raw
        const parsed = JSON.parse(jsonOnly) as { copies?: { channel?: string; subject?: string; body?: string }[] }
        const items = Array.isArray(parsed.copies) ? parsed.copies : []
        for (const c of channels) {
          const found = items.find((x) => (x.channel ?? '').toLowerCase() === c.toLowerCase())
          const body = (found?.body ?? '').trim() || '—'
          const subject = c === 'email' ? (found?.subject ?? '').trim() : undefined
          const normalizedBody =
            ['facebook', 'instagram', 'linkedin', 'youtube'].includes(c) ? ensureSocialHashtags(body) : body
          const pl = primaryLink.trim()
          const withLink =
            pl && isValidHttpUrl(pl)
              ? ensureChannelBodyHasPrimaryLink(resolveLinkTokens(normalizedBody, pl), pl, true)
              : normalizedBody
          next[c] = { body: withLink, subject: subject || undefined }
        }
      } catch {
        const cleaned = stripMarkdownFences(raw) || raw || '—'
        const hasJsonShape = /"copies"\s*:/i.test(cleaned)
        for (const c of channels) {
          const recovered = extractChannelCopyFromLooseJson(cleaned, c)
          const fallbackBody =
            recovered?.body ||
            (hasJsonShape ? 'Could not cleanly parse AI response. Click "Generate text" again.' : cleaned)
          const body = ['facebook', 'instagram', 'linkedin', 'youtube'].includes(c)
            ? ensureSocialHashtags(fallbackBody)
            : fallbackBody
          const pl = primaryLink.trim()
          const withLink =
            pl && isValidHttpUrl(pl)
              ? ensureChannelBodyHasPrimaryLink(resolveLinkTokens(body, pl), pl, true)
              : body
          next[c] = { body: withLink, subject: c === 'email' ? recovered?.subject : undefined }
        }
      }
      return next
    } finally {
      clearTimeout(timer)
    }
  }, [channels, prompt, fullPrompt, getHeaders, primaryLink])

  const handleGenerateCopy = useCallback(async () => {
    if (!requireSignedIn()) return
    setMessage(null)
    setLoadingCopy(true)
    try {
      const next = await generateStudioChannelCopy()
      setCopyByChannel(next)
      setMessage('Text generated — review previews by channel.')
    } catch (err) {
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('abort')) {
        setMessage(
          'Text generation timed out. In local dev this often happens during heavy Next.js compile. Retry once after compile settles.'
        )
      } else if (err instanceof Error && err.message && !msg.includes('abort')) {
        setMessage(err.message)
      } else {
        setMessage('Text generation failed (network). Please retry.')
      }
    } finally {
      setLoadingCopy(false)
    }
  }, [generateStudioChannelCopy, requireSignedIn])

  const handleGenerateEmailSubject = useCallback(async () => {
    if (!requireSignedIn()) return
    if (!channels.includes('email')) return
    const emailBody = copyByChannel.email?.body?.trim()
    if (!prompt.trim() || !emailBody) {
      setMessage('Generate email body first, then generate a subject.')
      return
    }
    setMessage(null)
    setLoadingSubject(true)
    try {
      const ac = new AbortController()
      const timer = setTimeout(() => ac.abort(), API_TIMEOUT_MS)
      const system = [
        'You are a marketing copywriter for an Indian SMB.',
        'Generate ONE email subject line only.',
        'No quotes, no markdown, no labels like "Subject:".',
        'Keep it under 60 characters when possible.',
      ].join(' ')
      const subjectPrompt = [fullPrompt, '', 'Email body:', emailBody, '', 'Return a single subject line.'].join('\n')
      const res = await fetch('/api/ai/text/generate', {
        method: 'POST',
        headers: getHeaders(),
        signal: ac.signal,
        body: JSON.stringify({ prompt: subjectPrompt, system, temperature: 0.6, maxTokens: 80 }),
      })
      clearTimeout(timer)
      const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string }
      if (!res.ok) {
        setMessage(data.error ?? 'Subject generation failed')
        return
      }
      const subject = (data.text ?? '').trim().replace(/^subject\s*:\s*/i, '').trim()
      if (!subject) {
        setMessage('No subject returned.')
        return
      }
      setCopyByChannel((prev) => ({
        ...prev,
        email: { ...(prev.email ?? { body: emailBody }), subject },
      }))
      setMessage('Subject generated.')
    } catch {
      setMessage('Subject generation timed out.')
    } finally {
      setLoadingSubject(false)
    }
  }, [API_TIMEOUT_MS, channels, copyByChannel.email, fullPrompt, getHeaders, prompt, requireSignedIn])

  type ImageGenOverrides = { copyDigest?: string; hasCopy?: boolean }

  const handleGenerateImage = useCallback(
    async (overrides?: ImageGenOverrides) => {
      if (!requireSignedIn()) return
      const hasCampaignBrief = channels.length > 0 && !!prompt.trim()
      const standalone =
        imagePrompt.trim().length >= 3 || imagePurposeNote.trim().length >= 3
      if (!hasCampaignBrief && !standalone) {
        setMessage(
          'For image-only generation, add a visual description (3+ characters) or placement notes — or fill a campaign brief and select channels for full-studio context.'
        )
        return
      }
      if (brandLogoUrl.trim() && !isValidHttpUrl(brandLogoUrl)) {
        setMessage('Brand logo URL must be a valid http:// or https:// link (or leave empty).')
        return
      }

      const hasAnyCopy = overrides?.hasCopy ?? Object.keys(copyByChannel).length > 0
      const digest = overrides?.copyDigest ?? copyDigestForImage
      const useCaseLabel = IMAGE_USE_CASES.find((x) => x.id === imageUseCase)?.label ?? imageUseCase
      /** When no channel is selected, default layout hint for aspect (image-only mode). */
      const channelsForLayout = channels.length > 0 ? channels : ['instagram']

      setMessage(null)
      setLoadingImage(true)
      let imageTimer: ReturnType<typeof setTimeout> | undefined
      try {
        const ac = new AbortController()
        imageTimer = setTimeout(() => ac.abort(), IMAGE_API_TIMEOUT_MS)
        const primary = pickPrimaryChannel(channelsForLayout)
        const autoAspect = aspectRatioForPrimaryChannel(primary)
        const aspectRatio = imageAspect === 'auto' ? autoAspect : imageAspect
        const purposeBlock = [
          `Image use / placement: ${useCaseLabel}.`,
          imagePurposeNote.trim() ? `Placement notes: ${imagePurposeNote.trim()}` : null,
        ]
          .filter(Boolean)
          .join('\n')
        const visualBlock = imagePrompt.trim()
          ? `What the image should show (visual description): ${imagePrompt.trim()}`
          : hasCampaignBrief
            ? 'What the image should show: infer a single strong marketing visual from the campaign brief and placement above.'
            : imagePurposeNote.trim()
              ? `What the image should show: infer a compelling visual from the placement notes and use case (no separate visual paragraph was provided).`
              : 'What the image should show: high-quality marketing visual matching the use case and placement above.'
        const copyBlock = hasAnyCopy
          ? `Align with this generated channel copy when relevant:\n${digest}`
          : hasCampaignBrief
            ? 'Context: channel copy not generated yet — base the visual only on the campaign brief and fields above.'
            : 'Context: image-only request — ignore channel copy; use placement, use case, and visual fields only.'

        const brandBlock = [
          brandColors.trim() ? `Brand color palette (accents): ${brandColors.trim()}` : null,
          brandLogoUrl.trim() ? `Brand logo URL (style / placement hint): ${brandLogoUrl.trim()}` : null,
        ]
          .filter(Boolean)
          .join('\n')

        // Put the visual intent first when set so image backends (esp. HF) weight the scene description.
        const tailBlocks = [
          copyBlock,
          '',
          brandBlock,
          '',
          `Primary channel for layout: ${primary ?? 'instagram'} (aspect ${aspectRatio}).`,
          'Avoid illegible tiny text, cluttered watermarks, and blurry output.',
        ]
        const creativePrompt = (
          imagePrompt.trim()
            ? [visualBlock, '', purposeBlock, '', fullPrompt, '', ...tailBlocks]
            : [fullPrompt, '', purposeBlock, '', visualBlock, '', ...tailBlocks]
        )
          .filter(Boolean)
          .join('\n')
          .slice(0, 19000)

        const res = await fetch('/api/ai/image/generate', {
          method: 'POST',
          headers: getHeaders(),
          signal: ac.signal,
          body: JSON.stringify({
            prompt: creativePrompt,
            aspectRatio,
            style: imageStyle,
            negativePrompt: imageNegativePrompt.trim() || undefined,
            brandColors: brandColors.trim() || undefined,
            brandLogoUrl: brandLogoUrl.trim() || undefined,
          }),
        })
        const data = (await res.json().catch(() => ({}))) as {
          url?: string
          width?: number
          height?: number
          error?: string
          hint?: string
          provider?: string
        }
        if (!res.ok) {
          const hint = data.hint ? ` ${data.hint}` : ''
          setMessage([data.error ?? 'Image generation failed', hint].filter(Boolean).join(' — '))
          setGeneratedImages([])
          setLastImageProvider(null)
          return
        }
        if (!data.url) {
          setGeneratedImages([])
          setLastImageProvider(null)
          setMessage('No image URL returned.')
          return
        }
        const img = { id: `img-${Date.now()}`, url: data.url, width: data.width, height: data.height }
        setGeneratedImages([img])
        setLastImageProvider(typeof data.provider === 'string' ? data.provider : null)
        setMessage('Image generated — check previews.')
      } catch (err) {
        const aborted =
          (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError') ||
          (err instanceof Error && err.name === 'AbortError') ||
          (err instanceof Error && err.message.toLowerCase().includes('abort'))
        if (aborted) {
          setMessage(
            `Image generation timed out after ${Math.round(IMAGE_API_TIMEOUT_MS / 60_000)} minutes. If you use Hugging Face or a self-hosted worker, retry with a shorter visual description or check your provider status.`
          )
        } else {
          setMessage('Image generation failed (network).')
        }
        setGeneratedImages([])
        setLastImageProvider(null)
      } finally {
        if (imageTimer) clearTimeout(imageTimer)
        setLoadingImage(false)
      }
    },
    [
      brandColors,
      brandLogoUrl,
      channels,
      copyByChannel,
      copyDigestForImage,
      fullPrompt,
      getHeaders,
      imageAspect,
      imageNegativePrompt,
      imagePrompt,
      imagePurposeNote,
      imageStyle,
      imageUseCase,
      prompt,
      requireSignedIn,
    ]
  )

  const handleGenerateTextThenImage = useCallback(async () => {
    if (!requireSignedIn()) return
    if (!channels.length || !prompt.trim()) {
      setMessage('Select channels and add a brief first.')
      return
    }
    if (brandLogoUrl.trim() && !isValidHttpUrl(brandLogoUrl)) {
      setMessage('Brand logo URL must be valid https or leave empty.')
      return
    }
    setStudioChainBusy(true)
    setMessage(null)
    setLoadingCopy(true)
    let nextCopy: Record<string, ChannelCopy> | null = null
    try {
      try {
        nextCopy = await generateStudioChannelCopy()
        setCopyByChannel(nextCopy)
        setMessage('Text ready — generating image…')
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : ''
        if (msg.includes('abort')) {
          setMessage(
            'Text generation timed out. In local dev this often happens during heavy Next.js compile. Retry once after compile settles.'
          )
        } else if (err instanceof Error) {
          setMessage(err.message)
        } else {
          setMessage('Text generation failed.')
        }
        return
      } finally {
        setLoadingCopy(false)
      }

      if (!nextCopy) return

      setLoadingImage(true)
      try {
        await handleGenerateImage({
          copyDigest: buildDigestFromCopy(nextCopy),
          hasCopy: true,
        })
      } finally {
        setLoadingImage(false)
      }
    } finally {
      // Always clear so "Generate image" works after a failed text step (previously stuck true).
      setStudioChainBusy(false)
    }
  }, [
    brandLogoUrl,
    channels,
    generateStudioChannelCopy,
    handleGenerateImage,
    prompt,
    requireSignedIn,
  ])

  const handleGenerateVideo = useCallback(async () => {
    if (!requireSignedIn()) return
    const firstImage = generatedImages[0]?.url
    if (!firstImage) {
      setMessage('Generate an image first — video is built from the creative.')
      return
    }
    setMessage(null)
    setVideoLoadError(null)
    setLoadingVideo(true)
    try {
      const primary = pickPrimaryChannel(channels)
      const aspectRatio = primary === 'youtube' ? '16:9' : '9:16'
      const res = await fetch('/api/ai/video/from-image', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          imageUrl: firstImage,
          prompt: fullPrompt,
          durationSec: 10,
          aspectRatio,
          script: videoScript.trim() || undefined,
          scenePlan: videoScenePlan.trim() || undefined,
          voiceoverText: videoVoiceoverText.trim() || undefined,
          referenceAudioUrl: videoReferenceAudioUrl.trim() || undefined,
          lipSync: videoLipSync,
          shotCount: videoShotCount,
          fps: videoFps,
          seed: videoSeed.trim() ? Number(videoSeed.trim()) : undefined,
        }),
      })
      const data = (await res.json().catch(() => ({}))) as {
        status?: 'queued' | 'completed' | 'error' | 'unconfigured'
        jobId?: string
        result?: { url?: string; durationSec?: number; width?: number; height?: number }
        message?: string
        error?: string
      }
      if (!res.ok) {
        setMessage(data.error ?? 'Video generation failed')
        setVideoJob(null)
        return
      }
      setVideoJob({
        status: data.status,
        jobId: data.jobId,
        result: data.result,
        message: data.message,
      })
      if (data.result?.url) {
        setMessage(data.message ?? 'Video ready — preview below.')
      } else if (data.status === 'queued') {
        setMessage('Video job queued — preview will appear when the worker returns a URL.')
      } else if (data.status === 'unconfigured') {
        setMessage(data.message ?? 'Video generation not configured.')
      } else if (data.status === 'error') {
        setMessage(data.message ?? 'Video job failed.')
      } else {
        setMessage(data.message ?? 'Video requested — check status.')
      }
    } catch {
      setMessage('Video generation failed (network).')
      setVideoJob(null)
    } finally {
      setLoadingVideo(false)
    }
  }, [
    channels,
    fullPrompt,
    generatedImages,
    getHeaders,
    requireSignedIn,
    videoFps,
    videoLipSync,
    videoReferenceAudioUrl,
    videoScenePlan,
    videoScript,
    videoSeed,
    videoShotCount,
    videoVoiceoverText,
  ])

  const channelGroups = useMemo(
    () => ({
      messaging: CHANNEL_OPTIONS.filter((c) => ['email', 'sms', 'whatsapp'].includes(c.id)),
      social: CHANNEL_OPTIONS.filter((c) => !['email', 'sms', 'whatsapp'].includes(c.id)),
    }),
    []
  )

  const canGenerateText =
    channels.length > 0 && !!prompt.trim() && !loadingCopy && !studioChainBusy
  /** Image-only: visual description or placement notes — no campaign brief or channels required. */
  const hasStandaloneImageIntent =
    imagePrompt.trim().length >= 3 || imagePurposeNote.trim().length >= 3
  /** Full campaign path (brief + channels) or standalone creative fields above. */
  const hasImageGenerationContext =
    (channels.length > 0 && !!prompt.trim()) || hasStandaloneImageIntent
  const logoOkForImage = !brandLogoUrl.trim() || isValidHttpUrl(brandLogoUrl)
  const canGenerateImage =
    hasImageGenerationContext && logoOkForImage && !loadingImage && !studioChainBusy
  /** Chained text → image; `canGenerateText` already blocks `studioChainBusy` / copy loading. */
  const canGenerateTextThenImage = canGenerateText && !loadingImage
  const canGenerateVideo = generatedImages.length > 0 && !loadingVideo
  const linkIsValid = isValidHttpUrl(primaryLink)
  const linkError = !linkIsValid ? 'Enter a valid URL starting with http:// or https://' : null
  const ctaLabelClean = (ctaLabel || '').trim()
  const ctaLabelError =
    !ctaLabelClean ? 'CTA button text is required' : ctaLabelClean.length > 32 ? 'Keep CTA under 32 characters' : null

  const loadEmailTemplates = useCallback(async () => {
    if (!resolveAuthToken()) return
    setLoadingTemplates(true)
    try {
      const res = await fetch('/api/marketing/email-templates', {
        headers: getHeaders(),
      })
      const data = (await res.json().catch(() => ({}))) as { templates?: SavedEmailTemplate[] }
      if (res.ok) setEmailTemplates(data.templates || [])
    } finally {
      setLoadingTemplates(false)
    }
  }, [getHeaders, resolveAuthToken])

  const saveCurrentEmailAsTemplate = useCallback(async () => {
    if (!resolveAuthToken()) {
      setMessage('Please sign in to save templates.')
      return
    }
    const email = copyByChannel.email
    if (!email?.subject?.trim() || !email?.body?.trim()) {
      setMessage('Generate or write email subject/body first.')
      return
    }
    const name = templateName.trim() || `${goal} email template`
    setSavingTemplate(true)
    try {
      const resolvedBody = resolveLinkTokens(email.body, primaryLink)
      const htmlBody = emailHtmlMode
        ? (emailHtml.trim() || `<p>${resolvedBody.replace(/\n/g, '<br/>')}</p>`)
        : `<p>${resolvedBody.replace(/\n/g, '<br/>')}</p>`
      const res = await fetch('/api/marketing/email-templates', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          name,
          category: 'marketing',
          subject: resolveLinkTokens(email.subject, primaryLink),
          htmlContent: htmlBody,
          textContent: resolvedBody,
        }),
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        setMessage(t || 'Failed to save template')
        return
      }
      setMessage('Email template saved.')
      setTemplateName('')
      await loadEmailTemplates()
    } finally {
      setSavingTemplate(false)
    }
  }, [copyByChannel.email, emailHtml, emailHtmlMode, getHeaders, goal, loadEmailTemplates, primaryLink, resolveAuthToken, templateName])

  useEffect(() => {
    void loadEmailTemplates()
  }, [loadEmailTemplates])

  useEffect(() => {
    if (!resolveAuthToken()) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/ai/video/capabilities', { headers: getHeaders() })
        const data = (await res.json().catch(() => ({}))) as {
          mode?: 'dynamic' | 'local-fallback' | 'unconfigured'
          label?: string
          details?: string
        }
        if (cancelled) return
        if (res.ok) {
          setVideoCapability({
            mode: data.mode ?? 'unknown',
            label: data.label ?? 'Video worker',
            details: data.details,
          })
        } else {
          setVideoCapability({
            mode: 'unknown',
            label: 'Worker check unavailable',
            details: 'Could not query worker capability.',
          })
        }
      } catch {
        if (!cancelled) {
          setVideoCapability({
            mode: 'unknown',
            label: 'Worker check unavailable',
            details: 'Could not query worker capability.',
          })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [getHeaders, resolveAuthToken])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-7 w-7 rounded-full bg-violet-600 text-white text-sm font-semibold flex items-center justify-center">
              1
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-50">What are you trying to do?</label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Step 1</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We’ll tune copy and CTAs for this objective and audience.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    {GOALS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Audience</label>
                  <select
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    {AUDIENCES.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <div className="mt-0.5 h-7 w-7 rounded-full bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-sm font-semibold flex items-center justify-center">
              2
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-50">Where do you want to show this?</label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Step 2</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We’ll generate tailored versions per selected channel.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Messaging</p>
                  <div className="flex flex-wrap gap-2">
                    {channelGroups.messaging.map((ch) => (
                      <label key={ch.id} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channels.includes(ch.id)}
                          onChange={() => toggleChannel(ch.id)}
                          className="rounded border-slate-300"
                        />
                        {ch.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Social</p>
                  <div className="flex flex-wrap gap-2">
                    {channelGroups.social.map((ch) => (
                      <label key={ch.id} className="inline-flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={channels.includes(ch.id)}
                          onChange={() => toggleChannel(ch.id)}
                          className="rounded border-slate-300"
                        />
                        {ch.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
            <div className="mt-0.5 h-7 w-7 rounded-full bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 text-sm font-semibold flex items-center justify-center">
              3
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-50">Tell us about your offer</label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Step 3</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  A concrete brief produces better copy and creatives.
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Primary link</label>
                <input
                  value={primaryLink}
                  onChange={(e) => setPrimaryLink(e.target.value)}
                  placeholder="https://yourdomain.com/offer"
                  className={[
                    'mt-1 w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm',
                    linkError
                      ? 'border-red-300 dark:border-red-600'
                      : 'border-slate-200 dark:border-slate-700',
                  ].join(' ')}
                />
                {linkError ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{linkError}</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    We’ll replace <span className="font-mono">[link]</span> with this URL in previews and exports.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">CTA button text</label>
                <input
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Book a call / Get quote / Learn more"
                  className={[
                    'mt-1 w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm',
                    ctaLabelError ? 'border-red-300 dark:border-red-600' : 'border-slate-200 dark:border-slate-700',
                  ].join(' ')}
                />
                {ctaLabelError ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{ctaLabelError}</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Used for Email CTA button (services often prefer “Book a call”, “Get quote”, etc.).
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Brief / prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  placeholder="Example: 3-day Diwali sale on men’s shoes, 30% off, free shipping above ₹1499, playful tone, target existing customers."
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div className="rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 px-3 py-2 space-y-2">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Creative image</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Say what the image is <span className="font-medium text-slate-700 dark:text-slate-300">for</span> and what it
                  should <span className="font-medium text-slate-700 dark:text-slate-300">show</span>. You can{' '}
                  <span className="font-medium">generate an image without</span> a campaign brief or channels — use a preset,
                  placement notes, or the visual description (a few words is enough). For copy-aligned creatives, add a brief and
                  channels, optionally <span className="font-medium">generate text</span> first.
                </p>
                <div className="pt-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Quick preset</label>
                  <select
                    value={imagePresetId}
                    onChange={(e) => {
                      const id = e.target.value
                      setImagePresetId(id)
                      const p = IMAGE_PRESETS.find((x) => x.id === id)
                      if (!p || id === 'none') return
                      if (p.useCase) setImageUseCase(p.useCase)
                      if (p.purposeNote) setImagePurposeNote(p.purposeNote)
                      if (p.promptTemplate) setImagePrompt(p.promptTemplate)
                    }}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    {IMAGE_PRESETS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Fills placement, notes, and a starter visual description — edit anything afterward.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  What will this image be used for?
                </label>
                <select
                  value={imageUseCase}
                  onChange={(e) => setImageUseCase(e.target.value as ImageUseCaseId)}
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                >
                  {IMAGE_USE_CASES.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Placement notes (optional)
                </label>
                <input
                  value={imagePurposeNote}
                  onChange={(e) => setImagePurposeNote(e.target.value)}
                  placeholder='e.g. "Hero on Diwali sale landing page" or "Sponsored LinkedIn Q4"'
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Image style</label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value as 'photo' | 'illustration')}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  >
                    <option value="photo">Realistic (Photo)</option>
                    <option value="illustration">Animated / Illustration</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Image dimensions</label>
                  <select
                    value={imageAspect}
                    onChange={(e) => setImageAspect(e.target.value as any)}
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    title="Auto chooses best size based on your primary channel"
                  >
                    <option value="auto">Auto (by primary channel)</option>
                    <option value="1:1">Square (1:1)</option>
                    <option value="4:5">Instagram Feed (4:5)</option>
                    <option value="9:16">Story/Reel (9:16)</option>
                    <option value="16:9">Wide (16:9)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Describe the image you want (optional but recommended)
                </label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={4}
                  placeholder="Example: Single hero product (men’s shoes) on a warm Diwali-themed set, soft lighting, minimal background, no overlaid text, premium retail feel."
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Scene, subjects, mood, colors, and what to avoid. If you leave this empty, we infer a visual from your brief
                  {Object.keys(copyByChannel).length > 0 ? ' and generated copy' : ''}.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Avoid in the image (optional)
                </label>
                <textarea
                  value={imageNegativePrompt}
                  onChange={(e) => setImageNegativePrompt(e.target.value)}
                  rows={2}
                  placeholder="e.g. blurry, watermark, extra fingers, cluttered text, competitor logos"
                  className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Sent to the image API as a negative prompt when supported (Hugging Face / self-hosted worker).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Brand colors (optional)
                  </label>
                  <input
                    value={brandColors}
                    onChange={(e) => setBrandColors(e.target.value)}
                    placeholder="e.g. #1a237e, gold, off-white"
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Logo URL (optional)
                  </label>
                  <input
                    value={brandLogoUrl}
                    onChange={(e) => setBrandLogoUrl(e.target.value)}
                    placeholder="https://…/logo.png"
                    className={[
                      'mt-1 w-full rounded-lg border bg-white dark:bg-slate-950 px-3 py-2 text-sm',
                      brandLogoUrl.trim() && !isValidHttpUrl(brandLogoUrl)
                        ? 'border-red-300 dark:border-red-600'
                        : 'border-slate-200 dark:border-slate-700',
                    ].join(' ')}
                  />
                  {brandLogoUrl.trim() && !isValidHttpUrl(brandLogoUrl) ? (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Use a valid http(s) URL or clear the field.</p>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Used as a brand hint for models (they do not download the file).
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 px-3 py-3 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Dynamic video controls</p>
                  <span
                    title={videoCapability.details ?? videoCapability.label}
                    className={[
                      'text-[11px] font-medium px-2 py-0.5 rounded-full border',
                      videoCapability.mode === 'dynamic'
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/40'
                        : videoCapability.mode === 'local-fallback'
                          ? 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:bg-amber-950/40'
                          : videoCapability.mode === 'unconfigured'
                            ? 'border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-950/40'
                            : 'border-slate-200 text-slate-600 bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:bg-slate-900',
                    ].join(' ')}
                  >
                    {videoCapability.label}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Used by external dynamic workers (AnimateDiff / SVD / Kling-style backends). Ignored by the local fallback worker.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Shot count</label>
                    <input
                      type="number"
                      min={1}
                      max={24}
                      value={videoShotCount}
                      onChange={(e) => setVideoShotCount(Math.max(1, Math.min(24, Number(e.target.value) || 1)))}
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">FPS</label>
                    <input
                      type="number"
                      min={8}
                      max={60}
                      value={videoFps}
                      onChange={(e) => setVideoFps(Math.max(8, Math.min(60, Number(e.target.value) || 24)))}
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={videoLipSync}
                    onChange={(e) => setVideoLipSync(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  Enable lip-sync
                </label>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Script (optional)</label>
                  <textarea
                    value={videoScript}
                    onChange={(e) => setVideoScript(e.target.value)}
                    rows={3}
                    placeholder="Narration/dialogue script for the video scene..."
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Scene plan (optional)</label>
                  <textarea
                    value={videoScenePlan}
                    onChange={(e) => setVideoScenePlan(e.target.value)}
                    rows={3}
                    placeholder="Shot 1: Wide office intro. Shot 2: Close-up typing. Shot 3: Checkout confirmation..."
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                    Voiceover text (optional)
                  </label>
                  <textarea
                    value={videoVoiceoverText}
                    onChange={(e) => setVideoVoiceoverText(e.target.value)}
                    rows={2}
                    placeholder="Voiceover text if your worker can auto-generate speech."
                    className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                      Reference audio URL (optional)
                    </label>
                    <input
                      value={videoReferenceAudioUrl}
                      onChange={(e) => setVideoReferenceAudioUrl(e.target.value)}
                      placeholder="https://.../voice-reference.wav"
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">Seed (optional)</label>
                    <input
                      value={videoSeed}
                      onChange={(e) => setVideoSeed(e.target.value)}
                      placeholder="12345"
                      className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            onClick={() => void handleGenerateCopy()}
            disabled={!canGenerateText}
            title={
              !channels.length
                ? 'Select at least one channel'
                : !prompt.trim()
                  ? 'Enter a brief first'
                  : loadingCopy
                    ? 'Generating…'
                    : 'Generate channel-specific drafts'
            }
            className="rounded-lg bg-violet-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingCopy ? 'Generating…' : 'Generate text'}
          </button>
          <button
            type="button"
            onClick={() => void handleGenerateTextThenImage()}
            disabled={!canGenerateTextThenImage}
            title={
              studioChainBusy || loadingImage
                ? 'Working…'
                : 'Generate channel copy, then a matching image in one flow'
            }
            className="rounded-lg bg-violet-700 text-white px-3 py-1.5 text-sm font-medium hover:bg-violet-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {studioChainBusy || loadingCopy || loadingImage ? 'Working…' : 'Generate text & image'}
          </button>
          <button
            type="button"
            onClick={() => void handleGenerateImage()}
            disabled={!canGenerateImage}
            title={
              !hasImageGenerationContext
                ? 'Add a brief + channels, or describe the image (3+ chars in visual or placement notes)'
                : !logoOkForImage
                  ? 'Fix logo URL or clear it'
                  : studioChainBusy
                    ? 'Text + image flow in progress…'
                    : loadingImage
                      ? 'Generating…'
                      : 'Generate image — with or without campaign brief / text copy'
            }
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingImage ? 'Generating…' : 'Generate image'}
          </button>
          <button
            type="button"
            onClick={() => void handleGenerateVideo()}
            disabled={!canGenerateVideo}
            title={generatedImages.length === 0 ? 'Generate an image first' : loadingVideo ? 'Generating…' : 'Generate a short video from the creative'}
            className="rounded-lg border border-slate-300 dark:border-slate-600 px-3 py-1.5 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingVideo ? 'Generating…' : 'Generate video'}
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Recommended: <span className="font-medium text-slate-600 dark:text-slate-300">Generate text</span> for each channel,
          then <span className="font-medium text-slate-600 dark:text-slate-300">Generate image</span> so the creative aligns with
          your copy — or generate an image from the brief alone using the creative image fields above. You can add a short
          video from the image when ready.
        </p>
        {lastImageProvider ? (
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Last image provider:{' '}
            <span className="font-mono rounded bg-slate-200/80 dark:bg-slate-800 px-1.5 py-0.5">{lastImageProvider}</span>
          </p>
        ) : null}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Keep content lawful and suitable for your audience. Third-party APIs may apply their own content policies; rate limits
          can apply on free tiers (retry after a short wait if you see rate-limit errors).
        </p>

        <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMessage(null)
              startTransition(async () => {
                const flattened: Record<string, string> | undefined =
                  Object.keys(copyByChannel).length > 0
                    ? Object.fromEntries(
                        Object.entries(copyByChannel).map(([ch, c]) => {
                          const resolvedBody = resolveLinkTokens(c.body, primaryLink)
                          const resolvedSubject = c.subject ? resolveLinkTokens(c.subject, primaryLink) : undefined
                          const parts =
                            ch === 'email' && resolvedSubject
                              ? [
                                  `Subject: ${resolvedSubject}`,
                                  '',
                                  resolvedBody,
                                  '',
                                  c.body.includes('[link]') ? `CTA: ${ctaLabelClean || 'Learn more'}` : '',
                                ]
                              : [resolvedBody]
                          return [ch, parts.filter(Boolean).join('\n')]
                        })
                      )
                    : undefined
                const r = await saveStudioDraftToLibrary({
                  tenantId,
                  goal,
                  channels,
                  prompt,
                  generatedCopyByChannel: flattened,
                  imageUrls: generatedImages.map((i) => i.url).filter(Boolean),
                  imageMeta: {
                    useCaseLabel: IMAGE_USE_CASES.find((x) => x.id === imageUseCase)?.label,
                    placementNotes: imagePurposeNote.trim() || undefined,
                    presetId: imagePresetId !== 'none' ? imagePresetId : undefined,
                    negativePrompt: imageNegativePrompt.trim() || undefined,
                    brandColors: brandColors.trim() || undefined,
                    brandLogoUrl: brandLogoUrl.trim() || undefined,
                    lastProvider: lastImageProvider ?? undefined,
                  },
                })
                setMessage(r.ok ? 'Saved draft to Library.' : r.error ?? 'Save failed')
              })
            }}
            className="rounded-xl bg-violet-600 text-white px-4 py-2 text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
          >
            {pending ? 'Saving…' : 'Save to Library'}
          </button>
          <Link
            href={`/marketing/${tenantId}/Campaigns/New`}
            className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Use in campaign
          </Link>
          <Link
            href={`/marketing/${tenantId}/Social-Media/Schedule`}
            className="inline-flex items-center rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Schedule social
          </Link>
        </div>
        {message && (
          <p className="text-sm text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 rounded-lg px-3 py-2 bg-slate-50 dark:bg-slate-950/50">
            {message}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Previews by channel</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            We’ll show what your audience will see on each channel. Edit your brief and regenerate any time.
          </p>
        </div>

        {generatedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            {generatedImages.map((img) => (
              <a
                key={img.id}
                href={img.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}

        {videoJob && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-sm bg-slate-50/80 dark:bg-slate-950/50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase text-slate-500">Video</p>
              {videoJob.status && (
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  {videoJob.status}
                </span>
              )}
            </div>
            {videoJob.result?.url ? (
              <div className="mt-2 space-y-1">
                <video
                  key={videoJob.result.url}
                  src={resolvePlaybackUrl(videoJob.result.url)}
                  controls
                  playsInline
                  className="w-full max-h-56 rounded-lg bg-black/80"
                  onError={() =>
                    setVideoLoadError(
                      'Could not play this file (missing file or wrong path). Use “Open video” below or regenerate.'
                    )
                  }
                  onLoadedData={() => setVideoLoadError(null)}
                />
                {videoLoadError ? (
                  <p className="text-xs text-amber-700 dark:text-amber-300">{videoLoadError}</p>
                ) : null}
                <a
                  href={resolvePlaybackUrl(videoJob.result.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Open video in new tab
                </a>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Current local mode animates a single image (subtle zoom/pan), not full scene motion.
                </p>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-300 mt-2">
                {videoJob.message ?? 'Generating video…'}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          {channels.map((c) => {
            const label = channelLabel(c)
            const copy = copyByChannel[c]
            const primaryImg = generatedImages[0]?.url
            const effectiveBrand =
              getPreviewAccountName(c) || socialBranding?.[c] || brandName || (c === 'instagram' ? 'yourbrand' : 'PayAid')
            const hasUsablePrimaryLink = Boolean(primaryLink.trim()) && isValidHttpUrl(primaryLink)
            const resolvedBody = ensureChannelBodyHasPrimaryLink(
              resolveLinkTokens(copy?.body ?? '', hasUsablePrimaryLink ? primaryLink : ''),
              primaryLink,
              hasUsablePrimaryLink
            )
            const resolvedSubject =
              c === 'email'
                ? resolveLinkTokens(copy?.subject ?? '', hasUsablePrimaryLink ? primaryLink : '')
                : undefined
            return (
              <div
                key={c}
                className="rounded-xl border border-slate-100 dark:border-slate-800 p-3 text-sm bg-slate-50/80 dark:bg-slate-950/50"
              >
                <p className="text-xs font-semibold uppercase text-slate-500 mb-1">{label}</p>
                {c === 'email' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase text-slate-500">Subject</p>
                      <button
                        type="button"
                        onClick={() => void handleGenerateEmailSubject()}
                        disabled={loadingSubject || !copyByChannel.email?.body}
                        title={loadingSubject ? 'Generating…' : 'Generate an email subject line'}
                        className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingSubject ? 'Generating…' : 'Generate subject'}
                      </button>
                    </div>
                    <input
                      value={copy?.subject ?? ''}
                      onChange={(e) =>
                        setCopyByChannel((prev) => ({
                          ...prev,
                          email: { ...(prev.email ?? { body: '' }), subject: e.target.value, body: prev.email?.body ?? '' },
                        }))
                      }
                      placeholder="Email subject"
                      className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                    />
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={emailHtmlMode}
                          onChange={(e) => setEmailHtmlMode(e.target.checked)}
                          className="rounded border-slate-300"
                        />
                        Rich email (HTML)
                      </label>
                      <button
                        type="button"
                        onClick={() => void loadEmailTemplates()}
                        className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                        disabled={loadingTemplates}
                      >
                        {loadingTemplates ? 'Refreshing…' : 'Refresh templates'}
                      </button>
                    </div>
                    {emailHtmlMode && (
                      <textarea
                        value={emailHtml}
                        onChange={(e) => setEmailHtml(e.target.value)}
                        rows={6}
                        placeholder="<h2>Your title</h2><p>Your rich HTML email body with logo/button markup…</p>"
                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-mono"
                      />
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        value={templateName}
                        onChange={(e) => setTemplateName(e.target.value)}
                        placeholder="Template name (optional)"
                        className="h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void saveCurrentEmailAsTemplate()}
                        disabled={savingTemplate}
                        className="h-9 rounded-lg border border-slate-300 dark:border-slate-600 px-3 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                      >
                        {savingTemplate ? 'Saving…' : 'Save as template'}
                      </button>
                    </div>
                    {emailTemplates.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select
                          className="h-9 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 text-sm"
                          defaultValue=""
                          onChange={(e) => {
                            const tpl = emailTemplates.find((t) => t.id === e.target.value)
                            if (!tpl) return
                            setCopyByChannel((prev) => ({
                              ...prev,
                              email: {
                                ...(prev.email ?? { body: '' }),
                                subject: tpl.subject,
                                body: tpl.textContent || prev.email?.body || '',
                              },
                            }))
                            setEmailHtml(tpl.htmlContent || '')
                            setEmailHtmlMode(Boolean(tpl.htmlContent))
                            setMessage(`Loaded template: ${tpl.name}`)
                          }}
                        >
                          <option value="">Load saved template…</option>
                          {emailTemplates.map((tpl) => (
                            <option key={tpl.id} value={tpl.id}>
                              {tpl.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950/40 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">{resolvedSubject || copy?.subject || '—'}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          To: customer@example.com · From: yourbrand@example.com
                        </p>
                      </div>
                      {primaryImg ? (
                        <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={primaryImg} alt="" className="w-full max-h-72 object-contain object-center" />
                        </div>
                      ) : null}
                      <div className="px-4 py-4 space-y-3">
                        {emailHtmlMode && emailHtml.trim() ? (
                          <div
                            className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-200"
                            dangerouslySetInnerHTML={{
                              __html: resolveLinkTokens(emailHtml, hasUsablePrimaryLink ? primaryLink : ''),
                            }}
                          />
                        ) : (
                          <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                            {(resolvedBody.trim()
                              ? resolvedBody
                              : 'Click “Generate text” to create an email draft.') + emailFooterPreviewLines(effectiveBrand)}
                          </p>
                        )}
                        <textarea
                          value={copy?.body ?? ''}
                          onChange={(e) =>
                            setCopyByChannel((prev) => ({
                              ...prev,
                              email: { ...(prev.email ?? { subject: prev.email?.subject }), body: e.target.value, subject: prev.email?.subject },
                            }))
                          }
                          rows={5}
                          placeholder="Edit email body…"
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                        />
                        {hasUsablePrimaryLink ? (
                          <div className="pt-1">
                            <a
                              href={primaryLink.trim()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-lg bg-violet-600 text-white px-3 py-2 text-sm font-semibold hover:bg-violet-700"
                              title="Primary CTA (preview)"
                            >
                              {ctaLabelClean || 'Learn more'}
                            </a>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              Button points to <span className="font-mono break-all">{primaryLink.trim()}</span>
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(c === 'facebook' || c === 'linkedin' || c === 'instagram') &&
                      (connectedByPlatform[c]?.length ?? 0) > 1 && (
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold uppercase text-slate-500">Preview as</p>
                          <select
                            value={previewAccountIdByPlatform[c] || ''}
                            onChange={(e) => setPreviewAccountIdByPlatform((prev) => ({ ...prev, [c]: e.target.value }))}
                            className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 text-xs text-slate-700 dark:text-slate-200"
                            title="Choose connected account identity"
                          >
                            <option value="">Default</option>
                            {(connectedByPlatform[c] || []).map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.accountName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    {c === 'facebook' || c === 'linkedin' ? (
                      <SocialPostPreview
                        channel={c}
                        body={resolvedBody || copy?.body || ''}
                        brandName={effectiveBrand}
                        imageUrl={primaryImg}
                        ctaHref={hasUsablePrimaryLink ? primaryLink.trim() : undefined}
                        ctaLabel={ctaLabelClean || 'Learn more'}
                      />
                    ) : c === 'instagram' ? (
                      <InstagramPreview
                        brandName={effectiveBrand}
                        body={resolvedBody || copy?.body || ''}
                        imageUrl={primaryImg}
                        ctaHref={hasUsablePrimaryLink ? primaryLink.trim() : undefined}
                        ctaLabel={ctaLabelClean || 'Learn more'}
                      />
                    ) : c === 'whatsapp' ? (
                      <WhatsappPreview brandName={effectiveBrand} body={resolvedBody || copy?.body || ''} />
                    ) : c === 'sms' ? (
                      <SmsPreview brandName={effectiveBrand} body={resolvedBody || copy?.body || ''} />
                    ) : (
                      <div className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-950/40 px-3 py-2 space-y-2">
                        <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                          {resolvedBody.trim()
                            ? resolvedBody
                            : 'Click “Generate text” to create a draft for this channel.'}
                        </p>
                        {hasUsablePrimaryLink ? (
                          <a
                            href={primaryLink.trim()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-3 py-2"
                          >
                            {ctaLabelClean || 'Learn more'}
                          </a>
                        ) : null}
                      </div>
                    )}
                    <textarea
                      value={copy?.body ?? ''}
                      onChange={(e) =>
                        setCopyByChannel((prev) => ({
                          ...prev,
                          [c]: { ...(prev[c] ?? { body: '' }), body: e.target.value },
                        }))
                      }
                      rows={4}
                      placeholder={`Edit ${label} copy…`}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm"
                    />
                    {!linkIsValid && (copy?.body ?? '').includes('[link]') && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Fix Primary link to replace <span className="font-mono">[link]</span> in previews.
                      </p>
                    )}
                    {['facebook', 'instagram', 'linkedin', 'youtube'].includes(c) && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Tip: Social posts work best with a short hook + benefits + CTA + hashtags.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
