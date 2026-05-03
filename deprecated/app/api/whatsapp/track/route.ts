/**
 * GET /api/whatsapp/track?contactId=...&type=open|click
 * Tracks WhatsApp "open" or "click" when a contact follows a tracking link in a message.
 * Updates contact whatsappStatus (opened: true and/or clicked: true), then redirects to redirectUrl or returns 204.
 * Optional: &redirectUrl=https://... (encoded) to send user after tracking.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const contactId = request.nextUrl.searchParams.get('contactId')
    const type = request.nextUrl.searchParams.get('type') // 'open' | 'click'
    const redirectUrl = request.nextUrl.searchParams.get('redirectUrl')

    if (!contactId || !type) {
      return NextResponse.json({ error: 'contactId and type required' }, { status: 400 })
    }
    if (!['open', 'click'].includes(type)) {
      return NextResponse.json({ error: 'type must be open or click' }, { status: 400 })
    }

    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      select: { id: true, tenantId: true, whatsappStatus: true },
    })

    if (!contact) {
      if (redirectUrl) {
        try {
          return NextResponse.redirect(decodeURIComponent(redirectUrl))
        } catch {
          return new NextResponse(null, { status: 204 })
        }
      }
      return new NextResponse(null, { status: 204 })
    }

    const existing = (contact.whatsappStatus as { sent?: boolean; opened?: boolean; replied?: boolean; clicked?: boolean }) || {}
    const updated = {
      ...existing,
      sent: true,
      opened: type === 'open' ? true : existing.opened,
      clicked: type === 'click' ? true : existing.clicked,
    }

    await prisma.contact.update({
      where: { id: contactId },
      data: { whatsappStatus: updated },
    })

    // Optional: trigger rescore in background (Phase 1A)
    if (process.env.GROQ_API_KEY) {
      import('@/lib/ai/lead-scorer-groq')
        .then(({ scoreContactWithGroqAndPersist }) =>
          scoreContactWithGroqAndPersist(contactId, contact.tenantId, { whatsappStatus: updated })
        )
        .catch((err) => console.error('WhatsApp track rescore error:', err))
    }

    if (redirectUrl) {
      try {
        return NextResponse.redirect(decodeURIComponent(redirectUrl))
      } catch {
        return new NextResponse(null, { status: 204 })
      }
    }
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    console.error('WhatsApp track error:', e)
    return NextResponse.json({ error: 'Track failed' }, { status: 500 })
  }
}
