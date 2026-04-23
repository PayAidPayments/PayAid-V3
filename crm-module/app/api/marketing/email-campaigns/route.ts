import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { prisma } from '@/lib/db/prisma'
import { addEmailCampaignDispatchJob } from '@/lib/queue/email-queue'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

const createEmailCampaignSchema = z.object({
  organizationId: z.string().optional(),
  name: z.string().min(1),
  subject: z.string().min(1),
  htmlContent: z.string().min(1),
  recipientSegments: z.array(z.string()).optional(),
  scheduledFor: z.string().datetime().optional(),
  senderAccountId: z.string().optional(),
  senderDomain: z.string().optional(),
})

type SegmentConfig = {
  stage?: string
  type?: string
  city?: string
  state?: string
  country?: string
  minLeadScore?: number
  lastContactedWithinDays?: number
  tagsAny?: string[]
}

function parseSegmentConfig(rawConfig: string | null | undefined): SegmentConfig {
  if (!rawConfig) return {}
  try {
    const parsed = JSON.parse(rawConfig)
    if (parsed && typeof parsed === 'object') {
      return parsed as SegmentConfig
    }
  } catch {
    // ignore invalid JSON and fallback to empty config
  }
  return {}
}

function buildContactWhereFromSegmentCriteria(
  tenantId: string,
  segment: { criteria: string; criteriaConfig: string | null }
): Prisma.ContactWhereInput {
  const config = parseSegmentConfig(segment.criteriaConfig)
  const criteria = (segment.criteria || '').toLowerCase()
  const where: Prisma.ContactWhereInput = {
    tenantId,
    status: 'active',
    email: { not: null },
  }

  if (config.stage) where.stage = config.stage
  if (config.type) where.type = config.type
  if (config.city) where.city = config.city
  if (config.state) where.state = config.state
  if (config.country) where.country = config.country
  if (typeof config.minLeadScore === 'number') where.leadScore = { gte: config.minLeadScore }
  if (typeof config.lastContactedWithinDays === 'number') {
    const since = new Date()
    since.setDate(since.getDate() - config.lastContactedWithinDays)
    where.lastContactedAt = { gte: since }
  }
  if (Array.isArray(config.tagsAny) && config.tagsAny.length > 0) {
    where.tags = { hasSome: config.tagsAny }
  }

  // Lightweight presets for common segment criteria strings.
  if (criteria.includes('lead')) where.type = where.type || 'lead'
  if (criteria.includes('customer')) where.stage = where.stage || 'customer'
  if (criteria.includes('prospect')) where.stage = where.stage || 'prospect'
  if (criteria.includes('churn')) where.churnRisk = true
  if (criteria.includes('high_value') || criteria.includes('high-value')) {
    where.leadScore = where.leadScore || { gte: 70 }
  }

  return where
}

async function resolveRecipientContactIds(tenantId: string, recipientSegments?: string[]): Promise<string[]> {
  if (!recipientSegments || recipientSegments.length === 0) {
    const contacts = await prisma.contact.findMany({
      where: {
        tenantId,
        status: 'active',
        email: { not: null },
      },
      select: { id: true },
      take: 10000,
    })
    return contacts.map((c) => c.id)
  }

  const segments = await prisma.segment.findMany({
    where: {
      tenantId,
      id: { in: recipientSegments },
    },
    select: {
      id: true,
      criteria: true,
      criteriaConfig: true,
    },
  })

  const contactIdSet = new Set<string>()
  for (const segment of segments) {
    const where = buildContactWhereFromSegmentCriteria(tenantId, segment)
    const contacts = await prisma.contact.findMany({
      where,
      select: { id: true },
      take: 10000,
    })
    for (const contact of contacts) {
      contactIdSet.add(contact.id)
    }
  }

  return Array.from(contactIdSet)
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const where = {
      tenantId,
      type: 'email',
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.campaign.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        campaigns: campaigns.map((campaign) => ({
          id: campaign.id,
          name: campaign.name,
          subject: campaign.subject,
          recipientCount: campaign.recipientCount,
          status: campaign.status,
          metrics: {
            totalSent: campaign.sent,
            opened: campaign.opened,
            clicked: campaign.clicked,
          },
        })),
        total,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('List email campaigns failed:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to list email campaigns' } }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const body = await request.json()
    const input = createEmailCampaignSchema.parse(body)
    const contactIds = await resolveRecipientContactIds(tenantId, input.recipientSegments)

    const campaign = await prisma.$transaction(async (tx) => {
      const created = await tx.campaign.create({
        data: {
          tenantId,
          name: input.name,
          type: 'email',
          subject: input.subject,
          content: input.htmlContent,
          segmentId: input.recipientSegments?.[0] || null,
          contactIds,
          status: input.scheduledFor ? 'scheduled' : 'draft',
          recipientCount: contactIds.length,
          scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        },
      })

      if (input.senderAccountId || input.senderDomain) {
        await tx.emailCampaignSenderPolicy.create({
          data: {
            tenantId,
            campaignId: created.id,
            senderAccountId: input.senderAccountId,
            senderDomain: input.senderDomain,
          },
        })
      }

      return created
    })

    if (!input.scheduledFor) {
      await addEmailCampaignDispatchJob({
        campaignId: campaign.id,
        tenantId,
        batchSize: 100,
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: campaign,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: { message: 'Validation error', details: error.errors } }, { status: 400 })
    }
    console.error('Create email campaign failed:', error)
    return NextResponse.json({ success: false, error: { message: 'Failed to create email campaign' } }, { status: 500 })
  }
}
