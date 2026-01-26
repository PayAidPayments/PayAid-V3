/**
 * Marketing Email Campaigns API Route
 * POST /api/marketing/email-campaigns - Create email campaign
 * GET /api/marketing/email-campaigns - List campaigns
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import type { ApiResponse } from '@/types/base-modules'
import type { EmailCampaign } from '@/modules/shared/marketing/types'
import { CreateEmailCampaignSchema } from '@/modules/shared/marketing/types'

/**
 * Create email campaign
 * POST /api/marketing/email-campaigns
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateEmailCampaignSchema.parse(body)

  // Calculate recipient count from segments
  let recipientCount = 0
  for (const segmentId of validatedData.recipientSegments) {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    })
    if (segment) {
      // Count contacts matching segment criteria
      const count = await prisma.contact.count({
        where: {
          tenantId: validatedData.organizationId,
          // Add segment criteria filtering here
        },
      })
      recipientCount += count
    }
  }

  const campaign = await prisma.campaign.create({
    data: {
      tenantId: validatedData.organizationId,
      name: validatedData.name,
      type: 'email',
      subject: validatedData.subject,
      content: validatedData.htmlContent,
      recipientCount,
      status: validatedData.scheduledFor ? 'scheduled' : 'draft',
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
      sent: 0,
      delivered: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      unsubscribed: 0,
      contactIds: [], // TODO: Map recipientSegments to contactIds
    },
  })

  const response: ApiResponse<EmailCampaign> = {
    success: true,
    statusCode: 201,
    data: {
      id: campaign.id,
      organizationId: campaign.tenantId,
      name: campaign.name,
      subject: campaign.subject || '',
      htmlContent: campaign.content,
      recipientSegments: campaign.contactIds,
      recipientCount: campaign.recipientCount,
      status: campaign.status as EmailCampaign['status'],
      scheduledFor: campaign.scheduledFor || undefined,
      sentAt: campaign.sentAt || undefined,
      openRate: campaign.recipientCount > 0 ? campaign.opened / campaign.recipientCount : 0,
      clickRate: campaign.recipientCount > 0 ? campaign.clicked / campaign.recipientCount : 0,
      conversionRate: undefined,
      unsubscribeCount: campaign.unsubscribed,
      metrics: {
        totalSent: campaign.sent,
        opened: campaign.opened,
        clicked: campaign.clicked,
        bounced: campaign.bounced,
        unsubscribed: campaign.unsubscribed,
      },
      createdAt: campaign.createdAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * List email campaigns
 * GET /api/marketing/email-campaigns?organizationId=xxx&status=sent&page=1&pageSize=20
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (status) {
    where.status = status
  }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.campaign.count({ where }),
  ])

  const formattedCampaigns: EmailCampaign[] = campaigns.map((campaign) => ({
    id: campaign.id,
    organizationId: campaign.tenantId,
    name: campaign.name,
    subject: campaign.subject || '',
    htmlContent: campaign.content,
    recipientSegments: campaign.contactIds,
    recipientCount: campaign.recipientCount,
    status: campaign.status as EmailCampaign['status'],
    scheduledFor: campaign.scheduledFor || undefined,
    sentAt: campaign.sentAt || undefined,
    openRate: campaign.recipientCount > 0 ? campaign.opened / campaign.recipientCount : 0,
    clickRate: campaign.recipientCount > 0 ? campaign.clicked / campaign.recipientCount : 0,
    conversionRate: undefined,
    unsubscribeCount: campaign.unsubscribed,
    metrics: {
      totalSent: campaign.sent,
      opened: campaign.opened,
      clicked: campaign.clicked,
      bounced: campaign.bounced,
      unsubscribed: campaign.unsubscribed,
    },
    createdAt: campaign.createdAt,
  }))

  const response: ApiResponse<{
    campaigns: EmailCampaign[]
    total: number
    page: number
    pageSize: number
  }> = {
    success: true,
    statusCode: 200,
    data: {
      campaigns: formattedCampaigns,
      total,
      page,
      pageSize,
    },
    meta: {
      pagination: {
        page,
        pageSize,
        total,
      },
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
