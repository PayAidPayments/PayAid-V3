import { NextRequest, NextResponse } from 'next/server'
import { syncInboundToCrm } from '@/lib/whatsapp/baileys'
import { addWhatsAppOutboundJob } from '@/lib/queue/whatsapp-queue'

/**
 * POST /api/whatsapp/webhook – Inbound WhatsApp webhook (Baileys or Meta Cloud API).
 * 1. Parse body (provider-specific: Baileys events vs Meta payload).
 * 2. Resolve tenant (e.g. by phone prefix or config).
 * 3. Sync to CRM: syncInboundToCrm(tenantId, phone, text, 'in').
 * 4. Optional: auto-reply or queue reply via addWhatsAppOutboundJob().
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    // Baileys: body might be { event, data: { from, message, ... } }
    // Meta: body.entry[].changes[].value.messages[]
    const from = body?.data?.from ?? body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from
    const text =
      body?.data?.message?.conversation ??
      body?.data?.message?.extendedTextMessage?.text ??
      body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.text?.body
    const phone = String(from ?? '').replace(/\D/g, '')
    if (!phone) {
      return NextResponse.json({ received: true })
    }
    // Resolve tenant (e.g. default or by config map)
    const tenantId = body?.tenantId ?? process.env.WHATSAPP_DEFAULT_TENANT_ID ?? 'default'
    await syncInboundToCrm(tenantId, phone, text ?? '', 'in')
    // Optional: queue a reply (e.g. "Thanks, we got your message")
    if (process.env.WHATSAPP_AUTO_REPLY_ENABLED === 'true') {
      try {
        await addWhatsAppOutboundJob({
          to: phone,
          text: process.env.WHATSAPP_AUTO_REPLY_TEXT ?? 'Thanks, we received your message.',
          tenantId,
        })
      } catch (_) {
        // Redis/queue may be unavailable
      }
    }
    return NextResponse.json({ received: true })
  } catch (e) {
    console.error('[whatsapp/webhook] error:', e)
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 })
  }
}
