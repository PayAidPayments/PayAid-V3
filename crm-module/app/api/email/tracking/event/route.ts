import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'

const trackingEventSchema = z.object({
  trackingId: z.string().min(1),
  messageId: z.string().optional(),
  contactId: z.string().optional(),
  campaignId: z.string().optional(),
  eventType: z.enum(['open', 'click', 'bounce', 'complaint', 'unsubscribe']),
  eventData: z.record(z.any()).optional(),
  occurredAt: z.string().datetime().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = trackingEventSchema.parse(body)
    const sendJob = await prisma.emailSendJob.findFirst({
      where: {
        OR: [{ id: input.trackingId }, { trackingId: input.trackingId }],
      },
      select: {
        tenantId: true,
        campaignId: true,
        contactId: true,
      },
    })

    if (!sendJob) {
      return NextResponse.json({ success: false, error: 'Unknown tracking id' }, { status: 404 })
    }

    const event = await prisma.emailTrackingEvent.create({
      data: {
        tenantId: sendJob.tenantId,
        trackingId: input.trackingId,
        messageId: input.messageId,
        contactId: input.contactId || sendJob.contactId || undefined,
        campaignId: input.campaignId || sendJob.campaignId || undefined,
        eventType: input.eventType,
        eventData: input.eventData,
        ipAddress: request.headers.get('x-forwarded-for') || null,
        userAgent: request.headers.get('user-agent') || null,
        referer: request.headers.get('referer') || null,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
      },
      select: { id: true, eventType: true, occurredAt: true },
    })

    return NextResponse.json({ success: true, data: event }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Create tracking event failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to create tracking event' }, { status: 500 })
  }
}
