/**
 * Bull worker for social-post-dispatch jobs.
 * Run: npx tsx server/workers/social-post-dispatch.ts
 * Requires: REDIS_URL (or default localhost:6379), DATABASE_URL
 *
 * Processes jobs with name 'social-post-dispatch' and data { marketingPostId }.
 * Loads MarketingPost, calls the appropriate connector (WhatsApp/Email/etc.), updates status.
 */

import Bull from 'bull'
import { PrismaClient } from '@prisma/client'
import { decrypt } from '../../lib/encryption.ts'

const prisma = new PrismaClient()
let emailCampaignQueue: Bull.Queue | null = null

function getRedisUrl(): string {
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  return url.trim()
}

function parseRedisUrl(redisUrl: string): { host: string; port: number; password?: string } {
  try {
    const parsed = new URL(redisUrl)
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      password: parsed.password || undefined,
    }
  } catch {
    const parts = redisUrl.replace('redis://', '').split(':')
    return {
      host: parts[0] || 'localhost',
      port: parts[1] ? parseInt(parts[1], 10) : 6379,
    }
  }
}

async function processSocialPostDispatch(job: Bull.Job<{ marketingPostId: string }>) {
  const { marketingPostId } = job.data
  const post = await prisma.marketingPost.findUnique({
    where: { id: marketingPostId },
  })
  if (!post) {
    console.warn(`[social-post-dispatch] MarketingPost not found: ${marketingPostId}`)
    return
  }
  if (post.status !== 'SCHEDULED') {
    console.warn(`[social-post-dispatch] Post ${marketingPostId} status is ${post.status}, skipping`)
    return
  }

  try {
    switch (post.channel) {
      case 'WHATSAPP':
        {
          const wa = await dispatchWhatsAppMarketingPost(post)
          await recordSocialPostOutcome(post, 'SENT', {
            providerPostId: null,
            dispatch: wa,
          })
          await prisma.marketingPost.update({
            where: { id: post.id },
            data: {
              status: 'SENT',
              metadata: {
                ...((post.metadata as object) || {}),
                whatsappDispatch: wa,
              },
              updatedAt: new Date(),
            },
          })
        }
        break
      case 'EMAIL':
        await dispatchEmailMarketingPost(post)
        await recordSocialPostOutcome(post, 'SENT', {
          providerPostId: null,
          dispatch: { via: 'email-campaign-queue' },
        })
        await prisma.marketingPost.update({
          where: { id: post.id },
          data: { status: 'SENT', updatedAt: new Date() },
        })
        break
      case 'SMS':
        {
          const sms = await dispatchSmsMarketingPost(post)
          await recordSocialPostOutcome(post, 'SENT', {
            providerPostId: null,
            dispatch: sms,
          })
          await prisma.marketingPost.update({
            where: { id: post.id },
            data: {
              status: 'SENT',
              metadata: {
                ...((post.metadata as object) || {}),
                smsDispatch: sms,
              },
              updatedAt: new Date(),
            },
          })
        }
        break
      case 'FACEBOOK':
        {
          const fb = await dispatchFacebookMarketingPost(post)
          await recordSocialPostOutcome(post, 'SENT', {
            providerPostId: fb.graphId ?? null,
            dispatch: fb,
          })
          await prisma.marketingPost.update({
            where: { id: post.id },
            data: {
              status: 'SENT',
              metadata: {
                ...((post.metadata as object) || {}),
                facebookDispatch: fb,
              },
              updatedAt: new Date(),
            },
          })
        }
        break
      case 'INSTAGRAM':
        {
          const ig = await dispatchInstagramMarketingPost(post)
          await recordSocialPostOutcome(post, 'SENT', {
            providerPostId: ig.mediaId ?? ig.containerId ?? null,
            dispatch: ig,
          })
          await prisma.marketingPost.update({
            where: { id: post.id },
            data: {
              status: 'SENT',
              metadata: {
                ...((post.metadata as object) || {}),
                instagramDispatch: ig,
              },
              updatedAt: new Date(),
            },
          })
        }
        break
      case 'TWITTER':
        {
          const tw = await dispatchTwitterMarketingPost(post)
          await recordSocialPostOutcome(post, 'SENT', {
            providerPostId: tw.tweetId ?? null,
            dispatch: tw,
          })
          await prisma.marketingPost.update({
            where: { id: post.id },
            data: {
              status: 'SENT',
              metadata: {
                ...((post.metadata as object) || {}),
                twitterDispatch: tw,
              },
              updatedAt: new Date(),
            },
          })
        }
        break
      case 'LINKEDIN':
        {
          const linkedIn = await dispatchLinkedInMarketingPost(post)
          await recordSocialPostOutcome(post, 'SENT', {
            providerPostId: linkedIn.postUrn ?? null,
            dispatch: linkedIn,
          })
          await prisma.marketingPost.update({
            where: { id: post.id },
            data: {
              status: 'SENT',
              metadata: {
                ...((post.metadata as object) || {}),
                linkedInDispatch: linkedIn,
              },
              updatedAt: new Date(),
            },
          })
        }
        break
      case 'YOUTUBE':
        {
          const yt = await dispatchYouTubeMarketingPost(post)
          await recordSocialPostOutcome(post, 'SENT', {
            providerPostId: yt.videoId ?? null,
            dispatch: yt,
          })
          await prisma.marketingPost.update({
            where: { id: post.id },
            data: {
              status: 'SENT',
              metadata: {
                ...((post.metadata as object) || {}),
                youtubeDispatch: yt,
              },
              updatedAt: new Date(),
            },
          })
        }
        break
      default:
        throw new Error(
          `Connector for channel ${post.channel} is not wired yet. Live dispatch is blocked to avoid false SENT status.`
        )
    }
  } catch (err) {
    console.error(`[social-post-dispatch] Failed for ${post.id}:`, err)
    await recordSocialPostOutcome(post, 'FAILED', {
      providerPostId: null,
      dispatch: {
        error: err instanceof Error ? err.message : String(err),
      },
    })
    await prisma.marketingPost.update({
      where: { id: post.id },
      data: {
        status: 'FAILED',
        metadata: {
          ...((post.metadata as object) || {}),
          error: err instanceof Error ? err.message : String(err),
        },
        updatedAt: new Date(),
      },
    })
    throw err
  }
}

function mapChannelToPlatform(channel: string): string | null {
  switch (channel) {
    case 'FACEBOOK':
      return 'facebook'
    case 'INSTAGRAM':
      return 'instagram'
    case 'TWITTER':
      return 'twitter'
    case 'LINKEDIN':
      return 'linkedin'
    case 'YOUTUBE':
      return 'youtube'
    case 'WHATSAPP':
      return 'whatsapp'
    case 'EMAIL':
      return 'email'
    case 'SMS':
      return 'sms'
    default:
      return null
  }
}

async function recordSocialPostOutcome(
  post: { id: string; tenantId: string; channel: string; content: string },
  status: 'SENT' | 'FAILED',
  options: { providerPostId: string | null; dispatch: unknown }
) {
  const platform = mapChannelToPlatform(post.channel)
  if (!platform) return

  const account = await prisma.socialMediaAccount.findFirst({
    where: {
      tenantId: post.tenantId,
      platform: { equals: platform, mode: 'insensitive' },
      isConnected: true,
    },
    select: { id: true },
  })
  if (!account?.id) return

  await prisma.socialPost.create({
    data: {
      tenantId: post.tenantId,
      accountId: account.id,
      content: post.content,
      platform,
      status: status === 'SENT' ? 'PUBLISHED' : 'FAILED',
      publishedAt: status === 'SENT' ? new Date() : null,
      platformPostId: options.providerPostId ?? undefined,
      errorMessage:
        status === 'FAILED'
          ? String((options.dispatch as any)?.error || 'Dispatch failed')
          : undefined,
    },
  })
}

function deriveEmailSubject(content: string): string {
  const line = (content || '')
    .split('\n')
    .map((x) => x.trim())
    .find(Boolean)
  const raw = line || 'Campaign update'
  return raw.slice(0, 140)
}

async function getContactsForSegment(
  tenantId: string,
  segmentId: string,
  options?: { requireEmail?: boolean; requirePhone?: boolean }
): Promise<string[]> {
  const contactFilter: Record<string, unknown> = { tenantId, status: 'active' }
  if (options?.requireEmail) contactFilter.email = { not: null }
  if (options?.requirePhone) contactFilter.phone = { not: null }

  const segment = await prisma.segment.findFirst({
    where: { id: segmentId, tenantId },
    select: { id: true, criteria: true },
  })
  if (!segment) return []
  const criteria = segment.criteria || ''

  if (criteria.includes('Total orders >') || criteria.includes('orders above')) {
    const amountMatch = criteria.match(/₹?([\d,]+)/)
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, '')) : 50000
    const contacts = await prisma.contact.findMany({
      where: {
        ...contactFilter,
        type: 'customer',
        orders: { some: { total: { gte: amount } } },
      },
      select: { id: true },
    })
    return contacts.map((c) => c.id)
  }

  if (criteria.includes('Last contacted') || criteria.includes('contacted in last')) {
    const daysMatch = criteria.match(/(\d+)\s*days?/)
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 30
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    const contacts = await prisma.contact.findMany({
      where: {
        ...contactFilter,
        type: 'lead',
        lastContactedAt: { gte: dateThreshold },
      },
      select: { id: true },
    })
    return contacts.map((c) => c.id)
  }

  if (criteria.includes('Deal stage') || criteria.includes('proposal') || criteria.includes('negotiation')) {
    const contacts = await prisma.contact.findMany({
      where: {
        ...contactFilter,
        deals: { some: { stage: { in: ['proposal', 'negotiation'] } } },
      },
      select: { id: true },
    })
    return contacts.map((c) => c.id)
  }

  if (criteria.includes('no orders') || criteria.includes('Inactive')) {
    const daysMatch = criteria.match(/(\d+)\s*days?/)
    const days = daysMatch ? parseInt(daysMatch[1], 10) : 90
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)
    const contacts = await prisma.contact.findMany({
      where: {
        ...contactFilter,
        type: 'customer',
        orders: { none: { createdAt: { gte: dateThreshold } } },
      },
      select: { id: true },
    })
    return contacts.map((c) => c.id)
  }

  const contacts = await prisma.contact.findMany({
    where: contactFilter,
    select: { id: true },
  })
  return contacts.map((c) => c.id)
}

async function dispatchEmailMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  segmentId: string | null
}) {
  const senderAccount = await prisma.emailAccount.findFirst({
    where: { tenantId: post.tenantId, isActive: true },
    select: { id: true },
  })
  if (!senderAccount) {
    throw new Error('No active email sender account configured for this tenant.')
  }

  const contactIds = post.segmentId
    ? await getContactsForSegment(post.tenantId, post.segmentId, { requireEmail: true })
    : (
        await prisma.contact.findMany({
          where: { tenantId: post.tenantId, status: 'active', email: { not: null } },
          select: { id: true },
        })
      ).map((c) => c.id)

  if (contactIds.length === 0) {
    throw new Error('No eligible contacts with email found for this post.')
  }

  const campaign = await prisma.campaign.create({
    data: {
      tenantId: post.tenantId,
      name: `Studio email post ${post.id.slice(0, 8)}`,
      type: 'email',
      subject: deriveEmailSubject(post.content),
      content: post.content,
      segmentId: post.segmentId || undefined,
      contactIds,
      recipientCount: contactIds.length,
      status: 'draft',
    },
    select: { id: true },
  })

  if (!emailCampaignQueue) {
    throw new Error('Email campaign queue is not initialized in social dispatch worker.')
  }
  await emailCampaignQueue.add(
    'dispatch-campaign',
    { campaignId: campaign.id, tenantId: post.tenantId },
    { jobId: `studio-email-campaign-${campaign.id}` }
  )
}

function normalizePhoneToE164(input: string): string | null {
  const raw = (input || '').trim()
  if (!raw) return null
  const hasPlus = raw.startsWith('+')
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return null
  if (hasPlus) return `+${digits}`
  if (digits.length === 10) return `+91${digits}`
  if (digits.length >= 11 && digits.length <= 15) return `+${digits}`
  return null
}

function toWahaChatId(e164: string): string {
  return `${e164.replace(/^\+/, '')}@c.us`
}

async function sendViaTwilioSms(options: {
  accountSid: string
  authToken: string
  fromNumber: string
  toE164: string
  body: string
}) {
  const auth = Buffer.from(`${options.accountSid}:${options.authToken}`).toString('base64')
  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(options.accountSid)}/Messages.json`
  const form = new URLSearchParams({
    From: options.fromNumber,
    To: options.toE164,
    Body: options.body,
  })
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
    cache: 'no-store' as any,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Twilio SMS failed (HTTP ${res.status})${t ? `: ${t.slice(0, 160)}` : ''}`)
  }
}

async function sendViaExotelSms(options: {
  accountSid: string
  authToken: string
  fromNumber: string
  toE164: string
  body: string
  apiBaseUrl?: string | null
}) {
  const auth = Buffer.from(`${options.accountSid}:${options.authToken}`).toString('base64')
  const base = (options.apiBaseUrl || 'https://api.exotel.com').replace(/\/+$/, '')
  const endpoints = [
    `${base}/v1/Accounts/${encodeURIComponent(options.accountSid)}/Sms/send.json`,
    `${base}/v1/Accounts/${encodeURIComponent(options.accountSid)}/sms/send`,
  ]
  const form = new URLSearchParams({
    From: options.fromNumber,
    To: options.toE164,
    Body: options.body,
  })
  let lastError = 'Exotel SMS request failed'
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        cache: 'no-store' as any,
      })
      if (res.ok) return
      const t = await res.text().catch(() => '')
      lastError = `Exotel SMS failed (HTTP ${res.status})${t ? `: ${t.slice(0, 160)}` : ''}`
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e)
    }
  }
  throw new Error(lastError)
}

async function sendViaWaha(options: {
  baseUrl: string
  apiKey: string
  instance: string
  toE164: string
  text: string
}): Promise<void> {
  const base = options.baseUrl.replace(/\/+$/, '')
  const chatId = toWahaChatId(options.toE164)
  const payloads = [
    {
      url: `${base}/api/sendText`,
      body: { session: options.instance, chatId, text: options.text },
    },
    {
      url: `${base}/api/sessions/${encodeURIComponent(options.instance)}/messages/text`,
      body: { chatId, text: options.text },
    },
  ]
  const headersVariants = [
    {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${options.apiKey}`,
    },
    {
      'Content-Type': 'application/json',
      'X-Api-Key': options.apiKey,
    },
    {
      'Content-Type': 'application/json',
      'x-api-key': options.apiKey,
    },
  ]

  let lastError = 'WAHA request failed'
  for (const p of payloads) {
    for (const headers of headersVariants) {
      try {
        const res = await fetch(p.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(p.body),
          cache: 'no-store' as any,
        })
        if (res.ok) return
        const t = await res.text().catch(() => '')
        lastError = `HTTP ${res.status} from ${p.url}${t ? `: ${t.slice(0, 160)}` : ''}`
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e)
      }
    }
  }
  throw new Error(lastError)
}

async function dispatchWhatsAppMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  segmentId: string | null
}) {
  const settings = await (prisma as any).tenantWahaSettings.findUnique({
    where: { tenantId: post.tenantId },
    select: { baseUrl: true, apiKeyEnc: true, defaultInstance: true, isConfigured: true },
  })
  if (!settings?.isConfigured || !settings.baseUrl || !settings.apiKeyEnc) {
    throw new Error('WAHA is not configured for this tenant.')
  }

  const apiKey = decrypt(settings.apiKeyEnc)
  const instance = settings.defaultInstance || 'default'
  const contacts = post.segmentId
    ? await prisma.contact.findMany({
        where: {
          tenantId: post.tenantId,
          id: { in: await getContactsForSegment(post.tenantId, post.segmentId, { requirePhone: true }) },
          status: 'active',
          phone: { not: null },
        },
        select: { id: true, phone: true },
      })
    : await prisma.contact.findMany({
        where: { tenantId: post.tenantId, status: 'active', phone: { not: null } },
        select: { id: true, phone: true },
      })

  if (contacts.length === 0) {
    throw new Error('No eligible contacts with phone numbers found for WhatsApp post.')
  }

  let sent = 0
  let failed = 0
  const failures: Array<{ contactId: string; reason: string }> = []
  for (const c of contacts) {
    const e164 = normalizePhoneToE164(c.phone || '')
    if (!e164) {
      failed++
      failures.push({ contactId: c.id, reason: 'Invalid phone format' })
      continue
    }
    try {
      await sendViaWaha({
        baseUrl: settings.baseUrl,
        apiKey,
        instance,
        toE164: e164,
        text: post.content,
      })
      sent++
    } catch (e) {
      failed++
      failures.push({
        contactId: c.id,
        reason: e instanceof Error ? e.message : String(e),
      })
    }
  }

  if (sent === 0) {
    throw new Error(
      `WAHA delivery failed for all contacts. Sample error: ${failures[0]?.reason || 'unknown'}`
    )
  }

  return {
    instance,
    attempted: contacts.length,
    sent,
    failed,
    failures: failures.slice(0, 10),
  }
}

async function dispatchSmsMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  segmentId: string | null
}) {
  const settings = await (prisma as any).tenantTelephonySettings.findUnique({
    where: { tenantId: post.tenantId },
    select: {
      provider: true,
      accountSid: true,
      authTokenEnc: true,
      apiBaseUrl: true,
      fromNumber: true,
      isConfigured: true,
    },
  })
  if (!settings?.isConfigured || !settings.provider || settings.provider === 'none') {
    throw new Error('SMS provider is not configured for this tenant.')
  }
  if (!settings.accountSid || !settings.authTokenEnc) {
    throw new Error('SMS credentials are missing (accountSid/authToken).')
  }
  if (!settings.fromNumber) {
    throw new Error('SMS fromNumber is not configured.')
  }

  const authToken = decrypt(settings.authTokenEnc)
  const contacts = post.segmentId
    ? await prisma.contact.findMany({
        where: {
          tenantId: post.tenantId,
          id: { in: await getContactsForSegment(post.tenantId, post.segmentId, { requirePhone: true }) },
          status: 'active',
          phone: { not: null },
        },
        select: { id: true, phone: true },
      })
    : await prisma.contact.findMany({
        where: { tenantId: post.tenantId, status: 'active', phone: { not: null } },
        select: { id: true, phone: true },
      })

  if (contacts.length === 0) {
    throw new Error('No eligible contacts with phone numbers found for SMS post.')
  }

  let sent = 0
  let failed = 0
  const failures: Array<{ contactId: string; reason: string }> = []
  for (const c of contacts) {
    const e164 = normalizePhoneToE164(c.phone || '')
    if (!e164) {
      failed++
      failures.push({ contactId: c.id, reason: 'Invalid phone format' })
      continue
    }
    try {
      if (settings.provider === 'twilio') {
        await sendViaTwilioSms({
          accountSid: settings.accountSid,
          authToken,
          fromNumber: settings.fromNumber,
          toE164: e164,
          body: post.content,
        })
      } else if (settings.provider === 'exotel') {
        await sendViaExotelSms({
          accountSid: settings.accountSid,
          authToken,
          fromNumber: settings.fromNumber,
          toE164: e164,
          body: post.content,
          apiBaseUrl: settings.apiBaseUrl,
        })
      } else {
        throw new Error(`Unsupported SMS provider: ${settings.provider}`)
      }
      sent++
    } catch (e) {
      failed++
      failures.push({
        contactId: c.id,
        reason: e instanceof Error ? e.message : String(e),
      })
    }
  }

  if (sent === 0) {
    throw new Error(
      `SMS delivery failed for all contacts. Sample error: ${failures[0]?.reason || 'unknown'}`
    )
  }

  return {
    provider: settings.provider,
    attempted: contacts.length,
    sent,
    failed,
    failures: failures.slice(0, 10),
  }
}

async function dispatchLinkedInMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  mediaIds?: string[]
}) {
  const integration = await prisma.oAuthIntegration.findFirst({
    where: { tenantId: post.tenantId, provider: 'linkedin', isActive: true },
    select: {
      id: true,
      accessToken: true,
      providerUserId: true,
      scope: true,
      expiresAt: true,
      lastUsedAt: true,
    },
  })
  if (!integration?.accessToken) {
    throw new Error('LinkedIn is not connected for this tenant.')
  }
  if (integration.expiresAt && integration.expiresAt.getTime() <= Date.now()) {
    throw new Error(
      'LinkedIn access token is expired. Reconnect LinkedIn with posting scope and retry.'
    )
  }

  const token = decrypt(integration.accessToken)
  const scope = String(integration.scope || '')
  if (!/w_member_social/i.test(scope)) {
    throw new Error(
      'LinkedIn token is missing posting scope (w_member_social). Reconnect LinkedIn with posting permissions.'
    )
  }

  const authorUrn = integration.providerUserId
    ? `urn:li:person:${integration.providerUserId}`
    : null
  if (!authorUrn) {
    throw new Error('LinkedIn account identifier is missing. Reconnect LinkedIn and retry.')
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: post.content },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  }

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(body),
    cache: 'no-store' as any,
  })

  if (!res.ok) {
    const t = await res.text().catch(() => '')
    const hint = t.includes('w_member_social')
      ? ' Missing w_member_social scope.'
      : ''
    throw new Error(
      `LinkedIn publish failed (HTTP ${res.status}).${hint} ${t.slice(0, 200)}`
    )
  }

  const postUrn = res.headers.get('x-restli-id') || null
  await prisma.oAuthIntegration.update({
    where: { id: integration.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    authorUrn,
    postUrn,
    postedAt: new Date().toISOString(),
  }
}

async function resolvePrimaryImageUrlForPost(post: {
  tenantId: string
  mediaIds: string[]
}): Promise<string | null> {
  if (!post.mediaIds?.length) return null
  const media = await prisma.mediaLibrary.findMany({
    where: { tenantId: post.tenantId, id: { in: post.mediaIds } },
    select: { fileUrl: true, mimeType: true },
  })
  const image = media.find((m) =>
    String(m.mimeType || '').toLowerCase().startsWith('image/')
  )
  return image?.fileUrl ?? null
}

async function dispatchFacebookMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  mediaIds: string[]
}) {
  const integration = await prisma.oAuthIntegration.findFirst({
    where: { tenantId: post.tenantId, provider: 'facebook', isActive: true },
    select: { id: true, accessToken: true, providerUserId: true, expiresAt: true, scope: true },
  })
  if (!integration?.accessToken) {
    throw new Error('Facebook is not connected for this tenant.')
  }
  if (integration.expiresAt && integration.expiresAt.getTime() <= Date.now()) {
    throw new Error('Facebook access token is expired. Reconnect Facebook and retry.')
  }

  const token = decrypt(integration.accessToken)
  const imageUrl = await resolvePrimaryImageUrlForPost(post)

  let endpoint = 'https://graph.facebook.com/v19.0/me/feed'
  const body = new URLSearchParams({
    access_token: token,
  })
  if (imageUrl) {
    endpoint = 'https://graph.facebook.com/v19.0/me/photos'
    body.set('url', imageUrl)
    body.set('caption', post.content)
  } else {
    body.set('message', post.content)
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    cache: 'no-store' as any,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`Facebook publish failed (HTTP ${res.status}). ${t.slice(0, 220)}`)
  }
  const payload = (await res.json().catch(() => ({}))) as { id?: string; post_id?: string }

  await prisma.oAuthIntegration.update({
    where: { id: integration.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    endpoint,
    graphId: payload.post_id || payload.id || null,
    usedImage: Boolean(imageUrl),
    postedAt: new Date().toISOString(),
  }
}

async function dispatchInstagramMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  mediaIds: string[]
}) {
  const integration = await prisma.oAuthIntegration.findFirst({
    where: { tenantId: post.tenantId, provider: 'instagram', isActive: true },
    select: { id: true, accessToken: true, expiresAt: true },
  })
  if (!integration?.accessToken) {
    throw new Error('Instagram is not connected for this tenant.')
  }
  if (integration.expiresAt && integration.expiresAt.getTime() <= Date.now()) {
    throw new Error('Instagram access token is expired. Reconnect Instagram and retry.')
  }

  const igAccount = await prisma.socialMediaAccount.findFirst({
    where: {
      tenantId: post.tenantId,
      platform: { equals: 'instagram', mode: 'insensitive' },
      isConnected: true,
      accountId: { not: null },
    },
    select: { accountId: true },
  })
  const igUserId = igAccount?.accountId || null
  if (!igUserId) {
    throw new Error(
      'Instagram Business account ID is missing. Connect Instagram business account/page and retry.'
    )
  }

  const token = decrypt(integration.accessToken)
  const imageUrl = await resolvePrimaryImageUrlForPost(post)
  if (!imageUrl) {
    throw new Error('Instagram requires an image. Generate or upload an image and retry.')
  }

  const createRes = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption: post.content,
        access_token: token,
      }).toString(),
      cache: 'no-store' as any,
    }
  )
  if (!createRes.ok) {
    const t = await createRes.text().catch(() => '')
    throw new Error(`Instagram media creation failed (HTTP ${createRes.status}). ${t.slice(0, 220)}`)
  }
  const createPayload = (await createRes.json().catch(() => ({}))) as { id?: string }
  if (!createPayload.id) {
    throw new Error('Instagram media creation did not return container id.')
  }

  const publishRes = await fetch(
    `https://graph.facebook.com/v19.0/${encodeURIComponent(igUserId)}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: createPayload.id,
        access_token: token,
      }).toString(),
      cache: 'no-store' as any,
    }
  )
  if (!publishRes.ok) {
    const t = await publishRes.text().catch(() => '')
    throw new Error(`Instagram publish failed (HTTP ${publishRes.status}). ${t.slice(0, 220)}`)
  }
  const publishPayload = (await publishRes.json().catch(() => ({}))) as { id?: string }

  await prisma.oAuthIntegration.update({
    where: { id: integration.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    igUserId,
    containerId: createPayload.id,
    mediaId: publishPayload.id || null,
    postedAt: new Date().toISOString(),
  }
}

async function dispatchTwitterMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  mediaIds: string[]
}) {
  const integration = await prisma.oAuthIntegration.findFirst({
    where: { tenantId: post.tenantId, provider: 'twitter', isActive: true },
    select: { id: true, accessToken: true, expiresAt: true, scope: true },
  })
  if (!integration?.accessToken) {
    throw new Error('X (Twitter) is not connected for this tenant.')
  }
  if (integration.expiresAt && integration.expiresAt.getTime() <= Date.now()) {
    throw new Error('X (Twitter) access token is expired. Reconnect and retry.')
  }

  const token = decrypt(integration.accessToken)
  const scope = String(integration.scope || '')
  if (scope && !/tweet\.write/i.test(scope)) {
    throw new Error(
      'X (Twitter) token is missing tweet.write scope. Reconnect with posting permissions.'
    )
  }

  const tweetPayload: Record<string, unknown> = { text: post.content }
  let mediaMode: 'none' | 'image' | 'video' = 'none'
  if (post.mediaIds?.length) {
    const assets = await prisma.mediaLibrary.findMany({
      where: { tenantId: post.tenantId, id: { in: post.mediaIds } },
      select: { fileUrl: true, mimeType: true },
      take: 4,
    })
    const imageAssets = assets.filter((a) =>
      String(a.mimeType || '').toLowerCase().startsWith('image/')
    )
    const videoAssets = assets.filter((a) =>
      String(a.mimeType || '').toLowerCase().startsWith('video/')
    )
    if (videoAssets.length > 1) {
      throw new Error('X supports only one video per post. Keep a single video and retry.')
    }
    if (videoAssets.length > 0 && imageAssets.length > 0) {
      throw new Error('X does not allow mixed image + video media in one post. Use one media type.')
    }
    if (imageAssets.length === 0 && videoAssets.length === 0) {
      throw new Error(
        'X media posting supports image/video assets only. Remove unsupported media and retry.'
      )
    }

    const mediaIds: string[] = []
    if (videoAssets.length > 0) {
      const video = videoAssets[0]
      mediaIds.push(await uploadTwitterMedia(token, video.fileUrl, video.mimeType || 'video/mp4'))
      mediaMode = 'video'
    } else {
      for (const asset of imageAssets) {
        mediaIds.push(await uploadTwitterMedia(token, asset.fileUrl, asset.mimeType || 'image/jpeg'))
      }
      mediaMode = 'image'
    }
    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds }
    }
  }

  const res = await fetch('https://api.x.com/2/tweets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tweetPayload),
    cache: 'no-store' as any,
  })
  if (!res.ok) {
    const t = await res.text().catch(() => '')
    throw new Error(`X publish failed (HTTP ${res.status}). ${t.slice(0, 220)}`)
  }
  const payload = (await res.json().catch(() => ({}))) as { data?: { id?: string; text?: string } }

  await prisma.oAuthIntegration.update({
    where: { id: integration.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    tweetId: payload?.data?.id || null,
    usedMedia: Boolean((tweetPayload as any)?.media?.media_ids?.length),
    mediaMode,
    postedAt: new Date().toISOString(),
  }
}

async function uploadTwitterMedia(
  accessToken: string,
  mediaUrl: string,
  declaredMimeType: string
): Promise<string> {
  const mediaRes = await fetch(mediaUrl, { cache: 'no-store' as any })
  if (!mediaRes.ok) {
    throw new Error(`X media fetch failed (HTTP ${mediaRes.status}) for ${mediaUrl}`)
  }
  const contentType = (mediaRes.headers.get('content-type') || declaredMimeType || 'application/octet-stream').toLowerCase()
  const isImage = contentType.startsWith('image/')
  const isVideo = contentType.startsWith('video/')
  if (!isImage && !isVideo) {
    throw new Error(`X media upload supports image/video only (got ${contentType}).`)
  }

  const ab = await mediaRes.arrayBuffer()
  const blob = new Blob([ab], { type: contentType })
  const form = new FormData()
  const filename = isVideo ? 'upload-video.mp4' : 'upload-image.jpg'
  form.append('media', blob, filename)
  if (isVideo) {
    form.append('media_category', 'tweet_video')
  }

  const uploadRes = await fetch('https://api.x.com/2/media/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
    cache: 'no-store' as any,
  })
  if (!uploadRes.ok) {
    const t = await uploadRes.text().catch(() => '')
    throw new Error(`X media upload failed (HTTP ${uploadRes.status}). ${t.slice(0, 220)}`)
  }
  const uploadPayload = (await uploadRes.json().catch(() => ({}))) as {
    data?: { id?: string }
    media_id?: string
    media_id_string?: string
  }
  const mediaId =
    uploadPayload?.data?.id || uploadPayload?.media_id_string || uploadPayload?.media_id
  if (!mediaId) {
    throw new Error('X media upload did not return media id.')
  }
  return mediaId
}

async function resolvePrimaryVideoForPost(post: {
  tenantId: string
  mediaIds: string[]
}): Promise<{ url: string; mimeType: string; title: string } | null> {
  if (!post.mediaIds?.length) return null
  const media = await prisma.mediaLibrary.findMany({
    where: { tenantId: post.tenantId, id: { in: post.mediaIds } },
    select: { fileUrl: true, mimeType: true, title: true, fileName: true },
    take: 10,
  })
  const video = media.find((m) =>
    String(m.mimeType || '').toLowerCase().startsWith('video/')
  )
  if (!video?.fileUrl) return null
  return {
    url: video.fileUrl,
    mimeType: video.mimeType || 'video/mp4',
    title: (video.title || video.fileName || 'Marketing video').slice(0, 90),
  }
}

async function dispatchYouTubeMarketingPost(post: {
  id: string
  tenantId: string
  content: string
  mediaIds: string[]
}) {
  const integration = await prisma.oAuthIntegration.findFirst({
    where: {
      tenantId: post.tenantId,
      provider: { in: ['youtube', 'google'] },
      isActive: true,
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      provider: true,
      accessToken: true,
      expiresAt: true,
      scope: true,
    },
  })
  if (!integration?.accessToken) {
    throw new Error('YouTube is not connected for this tenant.')
  }
  if (integration.expiresAt && integration.expiresAt.getTime() <= Date.now()) {
    throw new Error('YouTube access token is expired. Reconnect YouTube and retry.')
  }

  const scope = String(integration.scope || '')
  if (
    scope &&
    !/youtube\.upload/i.test(scope) &&
    !/youtube\.force-ssl/i.test(scope)
  ) {
    throw new Error(
      'YouTube token is missing upload scope (youtube.upload). Reconnect with YouTube publishing permissions.'
    )
  }

  const primaryVideo = await resolvePrimaryVideoForPost(post)
  if (!primaryVideo) {
    throw new Error('YouTube requires at least one video media asset.')
  }

  const videoFetch = await fetch(primaryVideo.url, { cache: 'no-store' as any })
  if (!videoFetch.ok) {
    throw new Error(
      `Failed to fetch YouTube video source (HTTP ${videoFetch.status}).`
    )
  }
  const contentType = videoFetch.headers.get('content-type') || primaryVideo.mimeType || 'video/mp4'
  if (!String(contentType).toLowerCase().startsWith('video/')) {
    throw new Error(`Selected media is not a video (${contentType}).`)
  }
  const buffer = await videoFetch.arrayBuffer()
  const token = decrypt(integration.accessToken)
  const description = post.content.slice(0, 5000)
  const title = (description.split('\n').map((x) => x.trim()).find(Boolean) || primaryVideo.title).slice(0, 100)

  const initRes = await fetch(
    'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=resumable',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': contentType,
        'X-Upload-Content-Length': String(buffer.byteLength),
      },
      body: JSON.stringify({
        snippet: {
          title,
          description,
        },
        status: {
          privacyStatus: 'public',
        },
      }),
      cache: 'no-store' as any,
    }
  )
  if (!initRes.ok) {
    const t = await initRes.text().catch(() => '')
    throw new Error(`YouTube upload init failed (HTTP ${initRes.status}). ${t.slice(0, 220)}`)
  }
  const uploadUrl = initRes.headers.get('location')
  if (!uploadUrl) {
    throw new Error('YouTube upload init did not return resumable location.')
  }

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': contentType,
    },
    body: Buffer.from(buffer),
    cache: 'no-store' as any,
  })
  if (!uploadRes.ok) {
    const t = await uploadRes.text().catch(() => '')
    throw new Error(`YouTube upload failed (HTTP ${uploadRes.status}). ${t.slice(0, 220)}`)
  }
  const payload = (await uploadRes.json().catch(() => ({}))) as { id?: string }
  const videoId = payload.id || null
  if (!videoId) {
    throw new Error('YouTube upload succeeded but no video id was returned.')
  }

  await prisma.oAuthIntegration.update({
    where: { id: integration.id },
    data: { lastUsedAt: new Date() },
  })

  return {
    provider: integration.provider,
    videoId,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
    postedAt: new Date().toISOString(),
  }
}

async function main() {
  const redisConfig = parseRedisUrl(getRedisUrl())
  const queue = new Bull('medium-priority', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 50,
      removeOnFail: 200,
    },
  })
  emailCampaignQueue = new Bull('email-campaign-dispatch', {
    redis: redisConfig,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  })

  queue.process(async (job: Bull.Job<{ marketingPostId?: string }>) => {
    if (job.data?.marketingPostId) {
      await processSocialPostDispatch(job as Bull.Job<{ marketingPostId: string }>)
    }
  })

  queue.on('completed', (job) => {
    console.log(`[social-post-dispatch] Job ${job.id} completed`)
  })
  queue.on('failed', (job, err) => {
    console.error(`[social-post-dispatch] Job ${job?.id} failed:`, err)
  })

  console.log('[social-post-dispatch] Worker listening on queue "medium-priority" for jobs with marketingPostId')
}

main().catch((err) => {
  console.error('[social-post-dispatch] Fatal:', err)
  process.exit(1)
})
