import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string }>
}

/**
 * Resolve lightweight context for unified-timeline → campaign deeplinks (`trackingEventId`, `smsReportId`,
 * `emailJobId`). Confirms rows belong to this tenant + campaign before the UI shows miss vs match banners.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { campaignId } = await context.params
    const sp = request.nextUrl.searchParams
    const trackingEventId = (sp.get('trackingEventId') || '').trim()
    const smsReportId = (sp.get('smsReportId') || '').trim()
    const emailJobId = (sp.get('emailJobId') || '').trim()

    if (!trackingEventId && !smsReportId && !emailJobId) {
      return NextResponse.json(
        { success: false, error: 'trackingEventId, smsReportId, or emailJobId is required' },
        { status: 400 }
      )
    }

    const data: {
      tracking?: { found: boolean; eventType?: string; occurredAt?: string }
      smsReport?: { found: boolean; status?: string; phoneNumber?: string }
      sendJob?: { found: boolean; status?: string; subject?: string | null }
    } = {}

    if (trackingEventId) {
      const ev = await prisma.emailTrackingEvent.findFirst({
        where: { id: trackingEventId, tenantId, campaignId },
        select: { eventType: true, occurredAt: true },
      })
      if (ev) {
        data.tracking = { found: true, eventType: ev.eventType, occurredAt: ev.occurredAt.toISOString() }
      } else {
        data.tracking = { found: false }
      }
    }

    if (smsReportId) {
      const row = await prisma.sMSDeliveryReport.findFirst({
        where: { id: smsReportId, tenantId, campaignId },
        select: { status: true, phoneNumber: true },
      })
      if (row) {
        data.smsReport = { found: true, status: row.status, phoneNumber: row.phoneNumber }
      } else {
        data.smsReport = { found: false }
      }
    }

    if (emailJobId) {
      const job = await prisma.emailSendJob.findFirst({
        where: { id: emailJobId, tenantId, campaignId },
        select: { status: true, subject: true },
      })
      if (job) {
        data.sendJob = { found: true, status: job.status, subject: job.subject }
      } else {
        data.sendJob = { found: false }
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Campaign deeplink context failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to resolve deeplink context' }, { status: 500 })
  }
}
