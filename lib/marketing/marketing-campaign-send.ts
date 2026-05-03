// @ts-nocheck — references Prisma models not yet in schema (marketing channel stack).
import 'server-only'

import { prisma } from '@/lib/db/prisma'
import { getSendGridClient } from '@/lib/email/sendgrid'
import { createHmac } from 'node:crypto'
import {
  assertMarketingSendAllowed,
  defaultCostInrForCampaignType,
  filterContactsByMarketingFrequencyCaps,
} from '@/lib/marketing/marketing-send-guard'

export type SendMarketingCampaignJobData = {
  campaignId: string
  tenantId: string
  campaignName: string
  type: string
  subject?: string | null
  content: string
  contactIds: string[]
  scheduledFor?: string | null
}

/**
 * Bull processor: send marketing campaign to allowed contacts; record ChannelEvent with cost + contactId.
 */
export async function processMarketingCampaignJob(data: SendMarketingCampaignJobData) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: data.campaignId, tenantId: data.tenantId },
  })
  if (!campaign) {
    console.warn('[marketing-campaign] Campaign not found:', data.campaignId)
    return { ok: false, reason: 'not_found' }
  }

  if (campaign.scheduledFor && campaign.scheduledFor > new Date()) {
    console.log('[marketing-campaign] Scheduled in future, skipping run:', campaign.id)
    return { ok: true, deferred: true }
  }

  const { allowed, skippedCap } = await filterContactsByMarketingFrequencyCaps(
    data.tenantId,
    campaign.contactIds
  )

  // Global email suppression: bounces + explicit unsubscribes.
  // (We still count recipientCount from original contactIds; the worker enforces suppression at send time.)
  const suppressedEmails = new Set<string>()
  try {
    const [bounces, optOuts] = await Promise.all([
      prisma.emailBounce.findMany({
        where: { tenantId: data.tenantId, isSuppressed: true },
        select: { emailAddress: true },
      }),
      prisma.emailOptOut.findMany({
        where: { tenantId: data.tenantId, isSuppressed: true },
        select: { emailAddress: true },
      }),
    ])
    for (const r of bounces) suppressedEmails.add((r.emailAddress || '').toLowerCase())
    for (const r of optOuts) suppressedEmails.add((r.emailAddress || '').toLowerCase())
  } catch (e) {
    console.warn('[marketing-campaign] suppression lookup failed (continuing):', e)
  }

  const guard = await assertMarketingSendAllowed(
    data.tenantId,
    {
      type: campaign.type,
      budgetInr: campaign.budgetInr,
      hardCap: campaign.hardCap,
    },
    { contactCount: allowed.length }
  )

  if (!guard.allowed) {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'failed', updatedAt: new Date() },
    })
    console.warn('[marketing-campaign] Guard blocked:', guard.code, guard.message)
    return { ok: false, code: guard.code }
  }

  const costInr = defaultCostInrForCampaignType(campaign.type)
  const channelType = campaign.type.toLowerCase()
  let sent = 0

  const contacts = await prisma.contact.findMany({
    where: { id: { in: allowed }, tenantId: data.tenantId },
    select: { id: true, email: true, phone: true },
  })
  const byId = new Map(contacts.map((c) => [c.id, c]))

  if (channelType === 'email') {
    const sg = getSendGridClient()
    const hasKey = Boolean(process.env.SENDGRID_API_KEY?.trim())
    if (allowed.length > 0 && !hasKey) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'failed', updatedAt: new Date() },
      })
      console.error('[marketing-campaign] SENDGRID_API_KEY missing; campaign marked failed')
      return { ok: false, reason: 'sendgrid_not_configured' }
    }
    const preferenceRows = await prisma.emailPreference.findMany({
      where: {
        tenantId: data.tenantId,
        emailAddress: { in: contacts.map((c) => (c.email || '').toLowerCase()).filter(Boolean) },
      },
      select: { emailAddress: true, frequency: true, topics: true, isPaused: true },
    })
    const prefByEmail = new Map(preferenceRows.map((r) => [r.emailAddress.toLowerCase(), r]))
    const campaignTopic = (campaign.playbookSlug || 'promotions').toLowerCase()

    for (const contactId of allowed) {
      const c = byId.get(contactId)
      const to = c?.email?.trim()
      if (!to) continue
      const lower = to.toLowerCase()
      if (suppressedEmails.has(lower)) continue
      const pref = prefByEmail.get(lower)
      if (pref?.isPaused || pref?.frequency === 'none') continue
      if (Array.isArray(pref?.topics) && pref.topics.length > 0 && !pref.topics.includes('all')) {
        if (!pref.topics.map((x) => x.toLowerCase()).includes(campaignTopic)) continue
      }
      try {
        const unsubscribeUrl = buildUnsubscribeUrl({
          tenantId: data.tenantId,
          email: to,
          campaignId: campaign.id,
        })
        const preferencesUrl = buildPreferencesUrl({
          tenantId: data.tenantId,
          email: to,
          campaignId: campaign.id,
        })
        const html = renderMarketingEmailHtml({
          tenantId: data.tenantId,
          campaignName: data.campaignName,
          subject: campaign.subject || data.campaignName,
          bodyText: campaign.content,
          unsubscribeUrl,
          preferencesUrl,
        })
        await sg.sendEmail({
          to,
          from: process.env.SENDGRID_FROM_EMAIL || 'noreply@payaid.com',
          subject: campaign.subject || data.campaignName,
          text: campaign.content,
          html,
        })
        await prisma.channelEvent.create({
          data: {
            tenantId: data.tenantId,
            channelType: 'email',
            campaignId: campaign.id,
            contactId,
            eventType: 'sent',
            costInr,
            meta: { source: 'marketing-campaign-worker' },
          },
        })
        sent++
      } catch (e) {
        console.error('[marketing-campaign] Email send failed for', contactId, e)
      }
    }
  } else if (channelType === 'whatsapp' || channelType === 'sms') {
    console.warn(
      `[marketing-campaign] ${channelType} connector not wired; ${allowed.length} recipients skipped (no events recorded).`
    )
  } else {
    console.warn('[marketing-campaign] Unknown campaign type:', campaign.type)
  }

  await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'sent',
      sentAt: new Date(),
      sent,
      recipientCount: campaign.contactIds.length,
      updatedAt: new Date(),
    },
  })

  return {
    ok: true,
    sent,
    skippedCap,
    attempted: allowed.length,
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function getUnsubSecret() {
  return (process.env.MARKETING_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || '').trim()
}

function base64UrlEncode(s: string) {
  return Buffer.from(s, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function hmacSha256Base64Url(secret: string, data: string) {
  const h = createHmac('sha256', secret).update(data).digest('base64')
  return h.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function buildUnsubscribeUrl(input: { tenantId: string; email: string; campaignId?: string }) {
  const secret = getUnsubSecret()
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90 // 90 days
  const payload = {
    tenantId: input.tenantId,
    email: input.email,
    campaignId: input.campaignId,
    exp,
  }
  const payloadPart = base64UrlEncode(JSON.stringify(payload))
  const sig = secret ? hmacSha256Base64Url(secret, payloadPart) : 'invalid'
  const token = `${payloadPart}.${sig}`
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${appUrl}/api/marketing/email/unsubscribe?token=${encodeURIComponent(token)}`
}

async function renderMarketingEmailHtml(input: {
  tenantId: string
  campaignName: string
  subject: string
  bodyText: string
  unsubscribeUrl: string
  preferencesUrl: string
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: {
      name: true,
      address: true,
      city: true,
      state: true,
      postalCode: true,
      country: true,
      phone: true,
      website: true,
      email: true,
    },
  })
  const brand = tenant?.name || 'PayAid'
  const addrParts = [tenant?.address, tenant?.city, tenant?.state, tenant?.postalCode, tenant?.country].filter(Boolean)
  const addressLine = addrParts.length ? addrParts.join(', ') : ''
  const body = escapeHtml(input.bodyText).replace(/\n/g, '<br/>')
  const disclaimer =
    'This message is intended for the addressed recipient(s). If you received this by mistake, please disregard.'

  return `
  <div style="background:#f8fafc;padding:24px 0;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;background:#faf5ff;">
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;font-weight:800;color:#4c1d95;font-size:16px;">${escapeHtml(
          brand
        )}</div>
        <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#6b7280;font-size:12px;margin-top:4px;">${
          escapeHtml(input.subject)
        }</div>
      </div>
      <div style="padding:22px 24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;color:#0f172a;font-size:14px;line-height:1.6;">
        ${body}
      </div>
      <div style="padding:18px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;">
        <div style="font-size:12px;color:#334155;">
          <strong>${escapeHtml(brand)}</strong>${addressLine ? ` · ${escapeHtml(addressLine)}` : ''}
          ${tenant?.phone ? ` · ${escapeHtml(tenant.phone)}` : ''}${tenant?.website ? ` · ${escapeHtml(tenant.website)}` : ''}
        </div>
        <div style="margin-top:10px;font-size:12px;color:#64748b;">
          <a href="${escapeHtml(input.preferencesUrl)}" style="color:#6d28d9;text-decoration:underline;">Manage preferences</a>
          <span style="color:#cbd5e1;margin:0 8px;">|</span>
          <a href="${escapeHtml(input.unsubscribeUrl)}" style="color:#6d28d9;text-decoration:underline;">Unsubscribe</a>
          <span style="color:#cbd5e1;margin:0 8px;">|</span>
          <span>${escapeHtml(disclaimer)}</span>
        </div>
      </div>
    </div>
  </div>`
}

function buildPreferencesUrl(input: { tenantId: string; email: string; campaignId?: string }) {
  const secret = getUnsubSecret()
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90
  const payload = {
    tenantId: input.tenantId,
    email: input.email,
    campaignId: input.campaignId,
    exp,
  }
  const payloadPart = base64UrlEncode(JSON.stringify(payload))
  const sig = secret ? hmacSha256Base64Url(secret, payloadPart) : 'invalid'
  const token = `${payloadPart}.${sig}`
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${appUrl}/api/marketing/email/preferences?token=${encodeURIComponent(token)}`
}
