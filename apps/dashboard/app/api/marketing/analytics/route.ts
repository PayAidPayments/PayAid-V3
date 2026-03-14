import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/marketing/analytics - Get aggregated marketing analytics
export async function GET(request: NextRequest) {
  try {
    // Check CRM module license (marketing analytics are part of CRM)
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    // Get all sent campaigns (or all campaigns if none are sent yet)
    const campaigns = await prisma.campaign.findMany({
      where: {
        tenantId: tenantId,
        status: {
          in: ['sent', 'scheduled'], // Include scheduled campaigns too
        },
      },
    })

    // Aggregate analytics
    const totalCampaigns = campaigns.length
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

    // Analytics by campaign type
    const emailCampaigns = campaigns.filter(c => c.type === 'email')
    const whatsappCampaigns = campaigns.filter(c => c.type === 'whatsapp')
    const smsCampaigns = campaigns.filter(c => c.type === 'sms')

    const typeAnalytics = {
      email: {
        count: emailCampaigns.length,
        sent: emailCampaigns.reduce((sum, c) => sum + c.sent, 0),
        delivered: emailCampaigns.reduce((sum, c) => sum + c.delivered, 0),
        opened: emailCampaigns.reduce((sum, c) => sum + c.opened, 0),
        clicked: emailCampaigns.reduce((sum, c) => sum + c.clicked, 0),
        openRate: emailCampaigns.reduce((sum, c) => sum + c.delivered, 0) > 0
          ? (emailCampaigns.reduce((sum, c) => sum + c.opened, 0) / emailCampaigns.reduce((sum, c) => sum + c.delivered, 0)) * 100
          : 0,
        clickRate: emailCampaigns.reduce((sum, c) => sum + c.delivered, 0) > 0
          ? (emailCampaigns.reduce((sum, c) => sum + c.clicked, 0) / emailCampaigns.reduce((sum, c) => sum + c.delivered, 0)) * 100
          : 0,
      },
      whatsapp: {
        count: whatsappCampaigns.length,
        sent: whatsappCampaigns.reduce((sum, c) => sum + c.sent, 0),
        delivered: whatsappCampaigns.reduce((sum, c) => sum + c.delivered, 0),
        opened: whatsappCampaigns.reduce((sum, c) => sum + c.opened, 0),
        clicked: whatsappCampaigns.reduce((sum, c) => sum + c.clicked, 0),
        openRate: whatsappCampaigns.reduce((sum, c) => sum + c.delivered, 0) > 0
          ? (whatsappCampaigns.reduce((sum, c) => sum + c.opened, 0) / whatsappCampaigns.reduce((sum, c) => sum + c.delivered, 0)) * 100
          : 0,
        clickRate: whatsappCampaigns.reduce((sum, c) => sum + c.delivered, 0) > 0
          ? (whatsappCampaigns.reduce((sum, c) => sum + c.clicked, 0) / whatsappCampaigns.reduce((sum, c) => sum + c.delivered, 0)) * 100
          : 0,
      },
      sms: {
        count: smsCampaigns.length,
        sent: smsCampaigns.reduce((sum, c) => sum + c.sent, 0),
        delivered: smsCampaigns.reduce((sum, c) => sum + c.delivered, 0),
        opened: smsCampaigns.reduce((sum, c) => sum + c.opened, 0),
        clicked: smsCampaigns.reduce((sum, c) => sum + c.clicked, 0),
        openRate: 0, // SMS doesn't track opens
        clickRate: smsCampaigns.reduce((sum, c) => sum + c.delivered, 0) > 0
          ? (smsCampaigns.reduce((sum, c) => sum + c.clicked, 0) / smsCampaigns.reduce((sum, c) => sum + c.delivered, 0)) * 100
          : 0,
      },
    }

    // Top performing campaigns
    const topCampaigns = campaigns
      .filter(c => c.delivered > 0)
      .map(c => ({
        id: c.id,
        name: c.name,
        type: c.type,
        openRate: c.delivered > 0 ? (c.opened / c.delivered) * 100 : 0,
        clickRate: c.delivered > 0 ? (c.clicked / c.delivered) * 100 : 0,
        sent: c.sent,
        delivered: c.delivered,
        opened: c.opened,
        clicked: c.clicked,
        createdAt: c.createdAt.toISOString(),
      }))
      .sort((a, b) => b.openRate - a.openRate)
      .slice(0, 5)

    // Time-series data for charts (last 6 months)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
    
    const monthlyData: Record<string, {
      month: string
      sent: number
      delivered: number
      opened: number
      clicked: number
      campaigns: number
    }> = {}

    // Initialize all months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      monthlyData[monthKey] = {
        month: monthName,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
        campaigns: 0,
      }
    }

    // Aggregate by month
    campaigns.forEach(campaign => {
      const campaignDate = new Date(campaign.createdAt)
      if (campaignDate >= sixMonthsAgo) {
        const monthKey = `${campaignDate.getFullYear()}-${String(campaignDate.getMonth() + 1).padStart(2, '0')}`
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].sent += campaign.sent
          monthlyData[monthKey].delivered += campaign.delivered
          monthlyData[monthKey].opened += campaign.opened
          monthlyData[monthKey].clicked += campaign.clicked
          monthlyData[monthKey].campaigns += 1
        }
      }
    })

    const monthlyTrend = Object.values(monthlyData)

    // Performance by day (last 30 days)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    
    const dailyData: Record<string, {
      date: string
      sent: number
      delivered: number
      opened: number
      clicked: number
    }> = {}

    // Initialize all days
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      const dateName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      dailyData[dateKey] = {
        date: dateName,
        sent: 0,
        delivered: 0,
        opened: 0,
        clicked: 0,
      }
    }

    // Aggregate by day (for campaigns sent in last 30 days)
    campaigns.forEach(campaign => {
      const campaignDate = new Date(campaign.createdAt)
      if (campaignDate >= thirtyDaysAgo) {
        const dateKey = campaignDate.toISOString().split('T')[0]
        if (dailyData[dateKey]) {
          dailyData[dateKey].sent += campaign.sent
          dailyData[dateKey].delivered += campaign.delivered
          dailyData[dateKey].opened += campaign.opened
          dailyData[dateKey].clicked += campaign.clicked
        }
      }
    })

    const dailyTrend = Object.values(dailyData)

    return NextResponse.json({
      overview: {
        totalCampaigns,
        totalSent,
        totalDelivered,
        totalOpened,
        totalClicked,
        totalBounced,
        totalUnsubscribed,
        deliveryRate,
        openRate,
        clickRate,
        clickThroughRate,
        bounceRate,
        unsubscribeRate,
      },
      byType: typeAnalytics,
      topCampaigns,
      monthlyTrend,
      dailyTrend,
    })
  } catch (error: any) {
    // Handle license errors first
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    console.error('Get marketing analytics error:', error)
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to get marketing analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
        errorType: error instanceof Error ? error.name : 'Unknown',
        overview: {
          totalCampaigns: 0,
          totalSent: 0,
          totalDelivered: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalBounced: 0,
          totalUnsubscribed: 0,
          deliveryRate: 0,
          openRate: 0,
          clickRate: 0,
          clickThroughRate: 0,
          bounceRate: 0,
          unsubscribeRate: 0,
        },
        byType: {
          email: { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 },
          whatsapp: { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 },
          sms: { count: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, openRate: 0, clickRate: 0 },
        },
        topCampaigns: [],
      },
      { status: 500 }
    )
  }
}
