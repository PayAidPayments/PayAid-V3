import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { buildCampaignDetailPayload } from '@/lib/marketing/campaign-detail-payload'
import { prisma } from '@/lib/db/prisma'

const patchCampaignSchema = z.object({
  budgetInr: z.number().int().min(0).nullable().optional(),
  spendInr: z.number().int().min(0).optional(),
  hardCap: z.boolean().optional(),
  playbookSlug: z.string().max(120).nullable().optional(),
})

// GET /api/marketing/campaigns/[id] - Get a single campaign (detail payload)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    const payload = await buildCampaignDetailPayload(resolvedParams.id, tenantId)
    if (!payload) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    return NextResponse.json(payload)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get campaign error:', error)
    return NextResponse.json({ error: 'Failed to get campaign' }, { status: 500 })
  }
}

// PATCH /api/marketing/campaigns/[id] - Update spend / budget fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'marketing')

    const body = await request.json()
    const validated = patchCampaignSchema.parse(body)

    const existing = await prisma.campaign.findFirst({
      where: { id: resolvedParams.id, tenantId },
      select: { id: true },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    await prisma.campaign.update({
      where: { id: resolvedParams.id },
      data: {
        ...(validated.budgetInr !== undefined ? { budgetInr: validated.budgetInr } : {}),
        ...(validated.spendInr !== undefined ? { spendInr: validated.spendInr } : {}),
        ...(validated.hardCap !== undefined ? { hardCap: validated.hardCap } : {}),
        ...(validated.playbookSlug !== undefined ? { playbookSlug: validated.playbookSlug } : {}),
      },
    })

    const payload = await buildCampaignDetailPayload(resolvedParams.id, tenantId)
    return NextResponse.json({ success: true, campaign: payload })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Patch campaign error:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}
