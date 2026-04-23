import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{ trackingId: string }>
}

function normalizeRedirectUrl(rawUrl: string | null): string {
  if (!rawUrl) return '/'
  try {
    const parsed = new URL(rawUrl)
    return parsed.toString()
  } catch {
    return '/'
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { trackingId } = await context.params
  const destination = normalizeRedirectUrl(request.nextUrl.searchParams.get('url'))

  try {
    const sendJob = await prisma.emailSendJob.findFirst({
      where: {
        OR: [{ id: trackingId }, { trackingId }],
      },
      select: {
        tenantId: true,
        campaignId: true,
        contactId: true,
      },
    })

    if (sendJob) {
      await prisma.emailTrackingEvent.create({
        data: {
          tenantId: sendJob.tenantId,
          trackingId,
          eventType: 'click',
          contactId: sendJob.contactId || undefined,
          campaignId: sendJob.campaignId || undefined,
          eventData: { destination },
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
          referer: request.headers.get('referer') || null,
          occurredAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('Link tracking write failed:', error)
  }

  return NextResponse.redirect(destination)
}
