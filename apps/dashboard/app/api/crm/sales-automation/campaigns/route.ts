import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'
import { findIdempotentRequest, markIdempotentRequest } from '@/lib/ai-native/m0-service'

const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['cold-email', 'cold-call', 'linkedin', 'multi-channel']),
  targetCriteria: z.string().optional(),
})

const OUTREACH_TYPES = ['cold-email', 'cold-call', 'linkedin', 'multi-channel'] as const

function mapRowToCampaignPayload(row: {
  id: string
  name: string
  type: string
  status: string
  prospectsCount: number
  contactedCount: number
  createdAt: Date
}) {
  const prospects = Math.max(0, row.prospectsCount)
  const contacted = Math.max(0, row.contactedCount)
  const denom = Math.max(prospects, 1)
  const responseRate = Math.round((contacted / denom) * 1000) / 10
  return {
    id: row.id,
    name: row.name,
    type: OUTREACH_TYPES.includes(row.type as (typeof OUTREACH_TYPES)[number])
      ? row.type
      : 'cold-email',
    status: row.status,
    prospectsCount: prospects,
    contactedCount: contacted,
    responseRate,
    conversionRate: 0,
    createdAt: row.createdAt.toISOString(),
  }
}

// GET /api/crm/sales-automation/campaigns — tenant outreach automations (persisted)
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const rows = await prisma.outreachAutomation.findMany({
      where: { tenantId },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    })

    const campaigns = rows.map(mapRowToCampaignPayload)
    return NextResponse.json({ campaigns })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get campaigns error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', message },
      { status: 500 }
    )
  }
}

// POST /api/crm/sales-automation/campaigns — create outreach automation (draft)
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const idempotencyKey = request.headers.get('x-idempotency-key')?.trim()
    if (idempotencyKey) {
      const existing = await findIdempotentRequest(tenantId, `crm:campaign:create:${idempotencyKey}`)
      const existingCampaignId = (existing?.afterSnapshot as { campaign_id?: string } | null)?.campaign_id
      if (existing && existingCampaignId) {
        return NextResponse.json(
          {
            success: true,
            deduplicated: true,
            campaign: { id: existingCampaignId },
          },
          { status: 200 }
        )
      }
    }

    const body = await request.json()
    const validated = createCampaignSchema.parse(body)

    const created = await prisma.outreachAutomation.create({
      data: {
        tenantId,
        name: validated.name.trim(),
        type: validated.type,
        targetCriteria: validated.targetCriteria?.trim() || null,
        status: 'draft',
        prospectsCount: 0,
        contactedCount: 0,
      },
    })

    if (idempotencyKey) {
      await markIdempotentRequest(tenantId, userId, `crm:campaign:create:${idempotencyKey}`, {
        campaign_id: created.id,
      })
    }

    const campaign = mapRowToCampaignPayload(created)

    return NextResponse.json({
      success: true,
      campaign,
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create campaign error:', error)
    const message = error instanceof Error ? error.message : 'Failed to create campaign'
    return NextResponse.json(
      { error: 'Failed to create campaign', message },
      { status: 500 }
    )
  }
}
