import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const syncLeadsSchema = z.object({
  visitorId: z.string().optional(),
  sessionId: z.string().optional(),
  minPageViews: z.number().default(3),
  minSessionDuration: z.number().default(60000), // 1 minute in ms
})

// POST /api/websites/[id]/sync-leads - Sync website visitors to CRM leads
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: websiteId } = await params
    const body = await request.json()
    const validated = syncLeadsSchema.parse(body)

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    })

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    // Get qualifying sessions
    const sessions = await prisma.websiteSession.findMany({
      where: {
        websiteId,
        ...(validated.visitorId ? { visitorId: validated.visitorId } : {}),
        ...(validated.sessionId ? { sessionId: validated.sessionId } : {}),
        pageViews: { gte: validated.minPageViews },
      },
      include: {
        visits: {
          take: 1,
          orderBy: { visitedAt: 'asc' },
        },
      },
    })

    // Filter by session duration
    const qualifyingSessions = sessions.filter((session) => {
      if (!session.lastActivityAt || !session.startedAt) return false
      const duration = new Date(session.lastActivityAt).getTime() - new Date(session.startedAt).getTime()
      return duration >= validated.minSessionDuration
    })

    const createdLeads: string[] = []

    for (const session of qualifyingSessions) {
      const firstVisit = session.visits[0]
      if (!firstVisit) continue

      // Check if lead already exists
      const existingLead = await prisma.contact.findFirst({
        where: {
          tenantId,
          source: 'website',
          sourceId: session.visitorId || session.sessionId,
        },
      })

      if (existingLead) continue

      // Extract email from events if available
      let email: string | undefined
      const emailEvent = await prisma.websiteEvent.findFirst({
        where: {
          websiteId,
          sessionId: session.id,
          eventName: 'email_capture',
        },
      })

      if (emailEvent?.metadata) {
        const metadata = emailEvent.metadata as any
        email = metadata.email
      }

      // Create lead
      const lead = await prisma.contact.create({
        data: {
          tenantId,
          name: email ? email.split('@')[0] : `Website Visitor ${session.visitorId?.substring(0, 8)}`,
          email: email,
          type: 'lead',
          status: 'active',
          source: 'website',
          sourceId: session.visitorId || session.sessionId,
          sourceData: {
            websiteId,
            sessionId: session.id,
            pageViews: session.pageViews,
            referrer: firstVisit.referrer,
            userAgent: session.userAgent,
          } as any,
          attributionChannel: firstVisit.referrer ? 'organic' : 'direct',
        },
      })

      createdLeads.push(lead.id)
    }

    return NextResponse.json({
      success: true,
      leadsCreated: createdLeads.length,
      leadIds: createdLeads,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Sync leads error:', error)
    return NextResponse.json(
      { error: 'Failed to sync leads' },
      { status: 500 }
    )
  }
}

