import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createHmac } from 'node:crypto'

function getSecret() {
  return (process.env.MARKETING_UNSUBSCRIBE_SECRET || process.env.JWT_SECRET || '').trim()
}

function base64UrlDecode(s: string) {
  const pad = '='.repeat((4 - (s.length % 4)) % 4)
  const b64 = (s + pad).replace(/-/g, '+').replace(/_/g, '/')
  return Buffer.from(b64, 'base64').toString('utf8')
}

function timingSafeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

async function hmacSha256Base64Url(secret: string, data: string) {
  const crypto = await import('node:crypto')
  const h = crypto.createHmac('sha256', secret).update(data).digest('base64')
  return h.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

type UnsubPayload = {
  tenantId: string
  email: string
  campaignId?: string
  exp?: number
}

async function verifyToken(token: string): Promise<UnsubPayload | null> {
  const secret = getSecret()
  if (!secret) return null
  const [payloadPart, sigPart] = token.split('.')
  if (!payloadPart || !sigPart) return null
  const expected = await hmacSha256Base64Url(secret, payloadPart)
  if (!timingSafeEq(expected, sigPart)) return null
  const raw = base64UrlDecode(payloadPart)
  const payload = JSON.parse(raw) as UnsubPayload
  if (!payload?.tenantId || !payload?.email) return null
  if (payload.exp && Date.now() / 1000 > payload.exp) return null
  return payload
}

function htmlPage(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px; max-width:640px; margin:0 auto; color:#0f172a;">${body}</body></html>`
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function buildPreferencesUrl(input: { tenantId: string; email: string; campaignId?: string }) {
  const secret = getSecret()
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 90
  const payload = {
    tenantId: input.tenantId,
    email: input.email,
    campaignId: input.campaignId,
    exp,
  }
  const payloadPart = base64UrlEncode(JSON.stringify(payload))
  const sig = secret ? createHmac('sha256', secret).update(payloadPart).digest('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '') : 'invalid'
  const token = `${payloadPart}.${sig}`
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '')
  return `${appUrl}/api/marketing/email/preferences?token=${encodeURIComponent(token)}`
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const payload = await verifyToken(token)
  if (!payload) {
    return new NextResponse(
      htmlPage('Unsubscribe', `<h2>Invalid link</h2><p>This unsubscribe link is invalid or expired.</p>`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const safeEmail = payload.email.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const body = `
    <h2>Unsubscribe</h2>
    <p>You are unsubscribing <strong>${safeEmail}</strong> from marketing emails.</p>
    <p style="margin-top:4px; font-size:13px; color:#475569;">Prefer fewer emails? <a href="${buildPreferencesUrl({ tenantId: payload.tenantId, email: payload.email, campaignId: payload.campaignId })}" style="color:#6d28d9;">Manage preferences</a> instead.</p>
    <form method="POST">
      <input type="hidden" name="token" value="${token.replace(/"/g, '&quot;')}"/>
      <label style="display:block; font-size:12px; color:#475569; font-weight:600; text-transform:uppercase; margin-top:16px;">Reason (optional)</label>
      <select name="reason" style="margin-top:6px; width:100%; padding:10px; border-radius:10px; border:1px solid #cbd5e1;">
        <option value="">Prefer not to say</option>
        <option value="too_many_emails">Too many emails</option>
        <option value="not_relevant">Not relevant</option>
        <option value="never_signed_up">I never signed up</option>
        <option value="other">Other</option>
      </select>
      <button type="submit" style="margin-top:16px; background:#6d28d9; color:white; border:none; padding:10px 14px; border-radius:12px; font-weight:700; cursor:pointer;">Unsubscribe</button>
    </form>
    <p style="margin-top:16px; font-size:12px; color:#64748b;">If you unsubscribed by mistake, you can re-subscribe by contacting the business.</p>
  `
  return new NextResponse(htmlPage('Unsubscribe', body), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const token = (form?.get('token') as string | null) || request.nextUrl.searchParams.get('token') || ''
  const reason = (form?.get('reason') as string | null) || undefined
  const payload = await verifyToken(token)
  if (!payload) {
    return new NextResponse(
      htmlPage('Unsubscribe', `<h2>Invalid link</h2><p>This unsubscribe link is invalid or expired.</p>`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  await prisma.emailOptOut.upsert({
    where: { tenantId_emailAddress: { tenantId: payload.tenantId, emailAddress: payload.email.toLowerCase() } },
    update: {
      reason: reason || undefined,
      campaignId: payload.campaignId || undefined,
      isSuppressed: true,
      suppressedAt: new Date(),
      source: 'unsubscribe-link',
    },
    create: {
      tenantId: payload.tenantId,
      emailAddress: payload.email.toLowerCase(),
      reason: reason || undefined,
      campaignId: payload.campaignId || undefined,
      isSuppressed: true,
      suppressedAt: new Date(),
      source: 'unsubscribe-link',
    },
  })

  if (payload.campaignId) {
    await prisma.campaign
      .update({
        where: { id: payload.campaignId },
        data: { unsubscribed: { increment: 1 } },
      })
      .catch(() => {})
  }

  return new NextResponse(
    htmlPage('Unsubscribed', `<h2>You’re unsubscribed</h2><p>You will no longer receive marketing emails from this business.</p>`),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

