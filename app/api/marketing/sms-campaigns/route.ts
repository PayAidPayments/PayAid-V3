/**
 * Marketing SMS Campaigns API Route
 * POST /api/marketing/sms-campaigns - Create SMS campaign
 * GET /api/marketing/sms-campaigns - List campaigns
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, SMSCampaign } from '@/types/base-modules'
import { CreateSMSCampaignSchema } from '@/modules/shared/marketing/types'

/**
 * Create SMS campaign
 * POST /api/marketing/sms-campaigns
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = CreateSMSCampaignSchema.parse(body)

  // Validate message length (max 160 chars for single SMS)
  if (validatedData.message.length > 160) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MESSAGE_TOO_LONG',
          message: 'SMS message must be 160 characters or less',
        },
      },
      { status: 400 }
    )
  }

  // Calculate recipient count from segments
  let recipientCount = 0
  for (const segmentId of validatedData.recipientSegments) {
    const segment = await prisma.segment.findUnique({
      where: { id: segmentId },
    })
    if (segment) {
      const count = await prisma.contact.count({
        where: {
          tenantId: validatedData.organizationId,
        },
      })
      recipientCount += count
    }
  }

  const campaign = await prisma.smsCampaign.create({
    data: {
      tenantId: validatedData.organizationId,
      name: validatedData.name,
      message: validatedData.message,
      recipientSegments: validatedData.recipientSegments,
      recipientCount,
      status: validatedData.scheduledFor ? 'scheduled' : 'draft',
      scheduledFor: validatedData.scheduledFor ? new Date(validatedData.scheduledFor) : null,
      deliveryRate: 0,
    },
  })

  const response: ApiResponse<SMSCampaign> = {
    success: true,
    statusCode: 201,
    data: {
      id: campaign.id,
      organizationId: campaign.tenantId,
      name: campaign.name,
      message: campaign.message,
      recipientSegments: campaign.recipientSegments as string[],
      recipientCount: campaign.recipientCount,
      status: campaign.status as SMSCampaign['status'],
      scheduledFor: campaign.scheduledFor || undefined,
      sentAt: campaign.sentAt || undefined,
      deliveryRate: campaign.deliveryRate,
      createdAt: campaign.createdAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * List SMS campaigns
 * GET /api/marketing/sms-campaigns?organizationId=xxx&status=sent&page=1&pageSize=20
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
    prisma.smsCampaign.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.smsCampaign.count({ where }),
  ])

  const formattedCampaigns: SMSCampaign[] = campaigns.map((campaign) => ({
    id: campaign.id,
    organizationId: campaign.tenantId,
    name: campaign.name,
    message: campaign.message,
    recipientSegments: campaign.recipientSegments as string[],
    recipientCount: campaign.recipientCount,
    status: campaign.status as SMSCampaign['status'],
    scheduledFor: campaign.scheduledFor || undefined,
    sentAt: campaign.sentAt || undefined,
    deliveryRate: campaign.deliveryRate,
    createdAt: campaign.createdAt,
  }))

  const response: ApiResponse<{
    campaigns: SMSCampaign[]
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
