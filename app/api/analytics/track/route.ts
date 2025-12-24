import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { headers } from 'next/headers'
import { z } from 'zod'

const trackEventSchema = z.object({
  trackingCode: z.string().min(1),
  eventType: z.string(),
  eventName: z.string().optional(),
  pagePath: z.string().optional(),
  elementId: z.string().optional(),
  elementText: z.string().optional(),
  elementSelector: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/analytics/track - Track website events (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = trackEventSchema.parse(body)

    // Get website by tracking code
    const website = await prisma.website.findUnique({
      where: { trackingCode: validated.trackingCode },
    })

    if (!website) {
      return NextResponse.json({ error: 'Invalid tracking code' }, { status: 404 })
    }

    // Get or create session
    const sessionId = request.headers.get('x-session-id') || generateSessionId()
    let session = await prisma.websiteSession.findUnique({
      where: { sessionId },
    })

    if (!session) {
      session = await prisma.websiteSession.create({
        data: {
          websiteId: website.id,
          sessionId,
          visitorId: request.headers.get('x-visitor-id') || generateVisitorId(),
          tenantId: website.tenantId,
        },
      })
    }

    // Get page if path provided
    let pageId: string | undefined
    if (validated.pagePath) {
      const page = await prisma.websitePage.findUnique({
        where: {
          websiteId_path: {
            websiteId: website.id,
            path: validated.pagePath,
          },
        },
      })
      pageId = page?.id
    }

    // Create event
    await prisma.websiteEvent.create({
      data: {
        websiteId: website.id,
        pageId,
        sessionId: session.id,
        eventType: validated.eventType,
        eventName: validated.eventName,
        elementId: validated.elementId,
        elementText: validated.elementText,
        elementSelector: validated.elementSelector,
        metadata: validated.metadata || {},
        tenantId: website.tenantId,
      },
    })

    return NextResponse.json({ success: true, sessionId })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Track event error:', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateVisitorId(): string {
  return `visitor_${Math.random().toString(36).substr(2, 16)}`
}
