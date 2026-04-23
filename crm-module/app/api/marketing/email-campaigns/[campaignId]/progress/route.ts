import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type RouteContext = {
  params: Promise<{ campaignId: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { campaignId } = await context.params

    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        tenantId,
        type: 'email',
      },
      select: {
        id: true,
        name: true,
        status: true,
        recipientCount: true,
        sent: true,
        delivered: true,
        bounced: true,
        opened: true,
        clicked: true,
        scheduledFor: true,
        sentAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    const grouped = await prisma.emailSendJob.groupBy({
      by: ['status'],
      where: {
        tenantId,
        campaignId,
      },
      _count: {
        _all: true,
      },
    })

    const failedByReason = await prisma.emailSendJob.groupBy({
      by: ['error'],
      where: {
        tenantId,
        campaignId,
        status: { in: ['failed', 'dead_letter'] },
        error: { not: null },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          _all: 'desc',
        },
      },
      take: 5,
    })

    const counts = grouped.reduce(
      (acc, row) => {
        acc[row.status] = row._count._all
        return acc
      },
      {} as Record<string, number>
    )

    const pending = counts.pending ?? 0
    const processing = counts.processing ?? 0
    const sent = counts.sent ?? 0
    const failed = counts.failed ?? 0
    const deadLetter = counts.dead_letter ?? 0
    const total = pending + processing + sent + failed + deadLetter
    const completed = sent + failed + deadLetter
    const completionPercent = total > 0 ? Number(((completed / total) * 100).toFixed(2)) : 0

    return NextResponse.json({
      success: true,
      data: {
        campaign,
        queue: {
          total,
          pending,
          processing,
          sent,
          failed,
          deadLetter,
          completed,
          completionPercent,
          isComplete: total > 0 && pending + processing === 0,
          topFailureReasons: failedByReason.map((row) => ({
            reason: row.error,
            count: row._count._all,
          })),
        },
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get campaign progress failed:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch campaign progress' }, { status: 500 })
  }
}
