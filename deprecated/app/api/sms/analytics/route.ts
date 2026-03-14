import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/sms/analytics - Get SMS analytics
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

    // Get delivery reports
    const reports = await prisma.sMSDeliveryReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    // Get campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        tenantId,
        type: 'sms',
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
    })

    // Calculate metrics from reports
    const totalSent = reports.length
    const delivered = reports.filter((r) => r.status === 'DELIVERED').length
    const failed = reports.filter((r) => r.status === 'FAILED').length
    const pending = reports.filter((r) => r.status === 'PENDING').length

    // Calculate rates
    const deliveryRate = totalSent > 0 ? (delivered / totalSent) * 100 : 0
    const failureRate = totalSent > 0 ? (failed / totalSent) * 100 : 0

    // Provider breakdown
    const twilioReports = reports.filter((r) => r.provider === 'twilio')
    const exotelReports = reports.filter((r) => r.provider === 'exotel')

    // Get opt-outs
    const optOuts = await prisma.sMSOptOut.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    // Campaign-level analytics
    const campaignAnalytics = campaigns.map((campaign) => {
      const campaignReports = reports.filter((r) => r.campaignId === campaign.id)
      const campaignDelivered = campaignReports.filter((r) => r.status === 'DELIVERED').length

      return {
        campaignId: campaign.id,
        campaignName: campaign.name,
        sent: campaign.sent,
        delivered: campaignDelivered,
        deliveryRate: campaign.sent > 0 ? (campaignDelivered / campaign.sent) * 100 : 0,
      }
    })

    return NextResponse.json({
      summary: {
        totalSent,
        delivered,
        failed,
        pending,
        deliveryRate: Math.round(deliveryRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
        totalOptOuts: optOuts.length,
      },
      providerBreakdown: {
        twilio: {
          total: twilioReports.length,
          delivered: twilioReports.filter((r) => r.status === 'DELIVERED').length,
          failed: twilioReports.filter((r) => r.status === 'FAILED').length,
        },
        exotel: {
          total: exotelReports.length,
          delivered: exotelReports.filter((r) => r.status === 'DELIVERED').length,
          failed: exotelReports.filter((r) => r.status === 'FAILED').length,
        },
      },
      campaigns: campaignAnalytics,
      recentOptOuts: optOuts.slice(0, 10).map((o) => ({
        id: o.id,
        phoneNumber: o.phoneNumber,
        reason: o.reason,
        createdAt: o.createdAt,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get SMS analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS analytics' },
      { status: 500 }
    )
  }
}

