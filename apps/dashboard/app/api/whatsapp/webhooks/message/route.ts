/**
 * WAHA / WhatsApp inbound webhook → P1-D4 CRM backlink.
 * Path referenced by lib/whatsapp/docker-helpers configureWahaWebhooks.
 */

import { NextRequest, NextResponse } from 'next/server'
import { handleWhatsAppInbound } from '@/lib/whatsapp/crm-sync'

function readSecret(req: NextRequest): string {
  return (
    req.headers.get('x-payaid-webhook-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    ''
  )
}

export async function POST(request: NextRequest) {
  try {
    const configured = process.env.WHATSAPP_WEBHOOK_SECRET || process.env.SOCIAL_WEBHOOK_INGEST_SECRET || ''
    if (configured && readSecret(request) !== configured) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const tenantId =
      request.nextUrl.searchParams.get('tenantId') ||
      body.tenantId ||
      body.tenant_id ||
      null

    if (!tenantId || typeof tenantId !== 'string') {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 })
    }

    const fromPhone =
      body.from ||
      body.phone ||
      body.payload?.from ||
      body.payload?.phone ||
      body._data?.Info?.SenderAlt ||
      null

    if (!fromPhone || typeof fromPhone !== 'string') {
      return NextResponse.json({ ok: true, skipped: 'no_phone' })
    }

    const text =
      (typeof body.body === 'string' && body.body) ||
      (typeof body.text === 'string' && body.text) ||
      (typeof body.payload?.body === 'string' && body.payload.body) ||
      ''

    const messageId =
      (typeof body.id === 'string' && body.id) ||
      (typeof body.messageId === 'string' && body.messageId) ||
      undefined

    const profileName =
      (typeof body.pushName === 'string' && body.pushName) ||
      (typeof body.profileName === 'string' && body.profileName) ||
      null

    const result = await handleWhatsAppInbound({
      tenantId,
      fromPhone,
      profileName,
      messageId,
      body: text,
    })

    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[whatsapp/webhooks/message]', error)
    return NextResponse.json({ error: 'Failed to process WhatsApp webhook' }, { status: 500 })
  }
}
