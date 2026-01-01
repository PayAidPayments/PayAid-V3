import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/email/analytics - Get email analytics
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'communication')

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const campaignId = searchParams.get('campaignId')

    const where: any = { tenantId }
    if (campaignId) where.campaignId = campaignId
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    // Get campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        tenantId,
        type: 'email',
        ...(campaignId ? { id: campaignId } : {}),
        ...(startDate || endDate
          ? {
              createdAt: {
                ...(startDate ? { gte: new Date(startDate) } : {}),
                ...(endDate ? { lte: new Date(endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        scheduledEmails: {
          where: {
            ...(startDate || endDate
              ? {
                  createdAt: {
                    ...(startDate ? { gte: new Date(startDate) } : {}),
                    ...(endDate ? { lte: new Date(endDate) } : {}),
                  },
                }
              : {}),
          },
        },
      },
    })

    // Calculate aggregate metrics
    const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0)
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0)
    const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0)
    const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0)
    const totalBounced = campaigns.reduce((sum, c) => sum + c.bounced, 0)
    const totalUnsubscribed = campaigns.reduce((sum, c) => sum + c.unsubscribed, 0)

    // Calculate rates
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0
    const clickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0
    const clickThroughRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0
    const unsubscribeRate = totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0

    // Get bounces
    const bounces = await prisma.emailBounce.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Campaign-level analytics
    const campaignAnalytics = campaigns.map((campaign) => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      sent: campaign.sent,
      delivered: campaign.delivered,
      opened: campaign.opened,
      clicked: campaign.clicked,
      bounced: campaign.bounced,
      unsubscribed: campaign.unsubscribed,
      deliveryRate: campaign.sent > 0 ? (campaign.delivered / campaign.sent) * 100 : 0,
      openRate: campaign.delivered > 0 ? (campaign.opened / campaign.delivered) * 100 : 0,
      clickRate: campaign.delivered > 0 ? (campaign.clicked / campaign.delivered) * 100 : 0,
    }))

    return NextResponse.json({
      summary: {
        totalCampaigns: campaigns.length,
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalBounced,
        totalUnsubscribed,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        clickThroughRate: Math.round(clickThroughRate * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
      },
      campaigns: campaignAnalytics,
      recentBounces: bounces.slice(0, 10).map((b) => ({
        id: b.id,
        emailAddress: b.emailAddress,
        bounceType: b.bounceType,
        bounceReason: b.bounceReason,
        createdAt: b.createdAt,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get email analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email analytics' },
      { status: 500 }
    )
  }
}

