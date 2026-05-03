import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { z } from 'zod'
import { UAParser } from 'ua-parser-js'

const trackVisitSchema = z.object({
  trackingCode: z.string().min(1),
  pagePath: z.string().default('/'),
  referrer: z.string().optional(),
})

// POST /api/analytics/visit - Track page visit (public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = trackVisitSchema.parse(body)

    // Get website by tracking code
    const website = await prisma.website.findUnique({
      where: { trackingCode: validated.trackingCode },
    })

    if (!website) {
      return NextResponse.json({ error: 'Invalid tracking code' }, { status: 404 })
    }

    // Get visitor info from headers
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = validated.referrer || request.headers.get('referer') || null

    // Parse user agent
    const parser = new UAParser(userAgent)
    const device = parser.getDevice().type || 'desktop'
    const browser = parser.getBrowser().name || 'unknown'
    const os = parser.getOS().name || 'unknown'

    // Get or create session
    const sessionId = request.headers.get('x-session-id') || generateSessionId()
    let session = await prisma.websiteSession.findUnique({
      where: { sessionId },
    })

    const visitorId = request.headers.get('x-visitor-id') || generateVisitorId()

    if (!session) {
      session = await prisma.websiteSession.create({
        data: {
          websiteId: website.id,
          sessionId,
          visitorId,
          tenantId: website.tenantId,
        },
      })
    } else {
      // Update session page views
      await prisma.websiteSession.update({
        where: { id: session.id },
        data: {
          pageViews: { increment: 1 },
          isBounce: false, // Multiple page views = not a bounce
        },
      })
    }

    // Get or create page
    let page = await prisma.websitePage.findUnique({
      where: {
        websiteId_path: {
          websiteId: website.id,
          path: validated.pagePath,
        },
      },
    })

    if (!page) {
      // Auto-create page if doesn't exist
      page = await prisma.websitePage.create({
        data: {
          websiteId: website.id,
          path: validated.pagePath,
          title: validated.pagePath === '/' ? 'Home' : validated.pagePath,
          contentJson: {},
          isPublished: true,
        },
      })
    }

    // Create visit record
    const visit = await prisma.websiteVisit.create({
      data: {
        websiteId: website.id,
        pageId: page.id,
        sessionId: session.id,
        ipAddress,
        userAgent,
        referrer,
        device: device === 'mobile' ? 'mobile' : device === 'tablet' ? 'tablet' : 'desktop',
        browser,
        os,
        tenantId: website.tenantId,
      },
    })

    return NextResponse.json({
      success: true,
      sessionId,
      visitorId,
      visitId: visit.id,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Track visit error:', error)
    return NextResponse.json({ error: 'Failed to track visit' }, { status: 500 })
  }
}

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function generateVisitorId(): string {
  return `visitor_${Math.random().toString(36).substr(2, 16)}`
}
