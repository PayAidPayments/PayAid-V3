import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

type RouteContext = {
  params: Promise<{ trackingId: string }>
}

const TRANSPARENT_GIF = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 10, 0, 1, 0, 44, 0, 0, 0, 0,
  1, 0, 1, 0, 0, 2, 2, 76, 1, 0, 59,
])

export async function GET(request: NextRequest, context: RouteContext) {
  const { trackingId } = await context.params

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
          contactId: sendJob.contactId || undefined,
          campaignId: sendJob.campaignId || undefined,
          eventType: 'open',
          ipAddress: request.headers.get('x-forwarded-for') || null,
          userAgent: request.headers.get('user-agent') || null,
          referer: request.headers.get('referer') || null,
          occurredAt: new Date(),
        },
      })
    }
  } catch (error) {
    console.error('Pixel tracking write failed:', error)
  }

  return new NextResponse(TRANSPARENT_GIF, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    },
  })
}
