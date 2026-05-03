import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

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

type TokenPayload = {
  tenantId: string
  email: string
  campaignId?: string
  exp?: number
}

async function verifyToken(token: string): Promise<TokenPayload | null> {
  const secret = getSecret()
  if (!secret) return null
  const [payloadPart, sigPart] = token.split('.')
  if (!payloadPart || !sigPart) return null
  const expected = await hmacSha256Base64Url(secret, payloadPart)
  if (!timingSafeEq(expected, sigPart)) return null
  const raw = base64UrlDecode(payloadPart)
  const payload = JSON.parse(raw) as TokenPayload
  if (!payload?.tenantId || !payload?.email) return null
  if (payload.exp && Date.now() / 1000 > payload.exp) return null
  return payload
}

function htmlPage(title: string, body: string) {
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${title}</title></head><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px; max-width:700px; margin:0 auto; color:#0f172a;">${body}</body></html>`
}

const TOPICS = ['promotions', 'product_updates', 'newsletters', 'events'] as const

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || ''
  const payload = await verifyToken(token)
  if (!payload) {
    return new NextResponse(
      htmlPage('Manage Preferences', `<h2>Invalid link</h2><p>This preferences link is invalid or expired.</p>`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const pref = await prisma.emailPreference.findUnique({
    where: { tenantId_emailAddress: { tenantId: payload.tenantId, emailAddress: payload.email.toLowerCase() } },
  })

  const freq = pref?.frequency || 'weekly'
  const paused = pref?.isPaused === true
  const topics = pref?.topics?.length ? pref.topics : ['all']
  const topicInputs = TOPICS.map((t) => {
    const checked = topics.includes('all') || topics.includes(t)
    const label = t.replace('_', ' ')
    return `<label style="display:block; margin:6px 0;">
      <input type="checkbox" name="topics" value="${t}" ${checked ? 'checked' : ''}/> ${label}
    </label>`
  }).join('')

  const body = `
    <h2>Manage email preferences</h2>
    <p>Choose what you want to receive and how often.</p>
    <form method="POST">
      <input type="hidden" name="token" value="${token.replace(/"/g, '&quot;')}"/>
      <label style="display:block; font-size:12px; color:#475569; font-weight:600; text-transform:uppercase;">Frequency</label>
      <select name="frequency" style="margin-top:6px; width:100%; padding:10px; border-radius:10px; border:1px solid #cbd5e1;">
        <option value="daily" ${freq === 'daily' ? 'selected' : ''}>Daily</option>
        <option value="weekly" ${freq === 'weekly' ? 'selected' : ''}>Weekly</option>
        <option value="monthly" ${freq === 'monthly' ? 'selected' : ''}>Monthly</option>
        <option value="none" ${freq === 'none' ? 'selected' : ''}>Do not send marketing emails</option>
      </select>
      <label style="display:block; margin-top:14px; font-size:12px; color:#475569; font-weight:600; text-transform:uppercase;">Topics</label>
      ${topicInputs}
      <label style="display:block; margin-top:12px;">
        <input type="checkbox" name="isPaused" value="1" ${paused ? 'checked' : ''}/> Pause all marketing emails
      </label>
      <button type="submit" style="margin-top:16px; background:#6d28d9; color:white; border:none; padding:10px 14px; border-radius:12px; font-weight:700; cursor:pointer;">Save preferences</button>
    </form>
    <p style="margin-top:14px; font-size:12px; color:#64748b;">You can fully unsubscribe anytime from the unsubscribe link.</p>
  `

  return new NextResponse(htmlPage('Manage Preferences', body), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null)
  const token = (form?.get('token') as string | null) || request.nextUrl.searchParams.get('token') || ''
  const payload = await verifyToken(token)
  if (!payload) {
    return new NextResponse(
      htmlPage('Manage Preferences', `<h2>Invalid link</h2><p>This preferences link is invalid or expired.</p>`),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const frequency = String(form?.get('frequency') || 'weekly')
  const allowedFreq = new Set(['daily', 'weekly', 'monthly', 'none'])
  const safeFrequency = allowedFreq.has(frequency) ? frequency : 'weekly'

  const topicEntries = form?.getAll('topics').map(String).filter(Boolean) || []
  const topics = topicEntries.length ? topicEntries.filter((t) => (TOPICS as readonly string[]).includes(t)) : ['all']
  const isPaused = String(form?.get('isPaused') || '') === '1'

  await prisma.emailPreference.upsert({
    where: { tenantId_emailAddress: { tenantId: payload.tenantId, emailAddress: payload.email.toLowerCase() } },
    update: {
      frequency: safeFrequency,
      topics: topics.length ? topics : ['all'],
      isPaused,
      source: 'manage-preferences',
    },
    create: {
      tenantId: payload.tenantId,
      emailAddress: payload.email.toLowerCase(),
      frequency: safeFrequency,
      topics: topics.length ? topics : ['all'],
      isPaused,
      source: 'manage-preferences',
    },
  })

  if (safeFrequency === 'none' || isPaused) {
    await prisma.emailOptOut.upsert({
      where: { tenantId_emailAddress: { tenantId: payload.tenantId, emailAddress: payload.email.toLowerCase() } },
      update: {
        source: 'manage-preferences',
        isSuppressed: true,
        suppressedAt: new Date(),
      },
      create: {
        tenantId: payload.tenantId,
        emailAddress: payload.email.toLowerCase(),
        source: 'manage-preferences',
        isSuppressed: true,
        suppressedAt: new Date(),
      },
    })
  }

  return new NextResponse(
    htmlPage('Preferences saved', `<h2>Preferences updated</h2><p>Your email preferences have been saved successfully.</p>`),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

