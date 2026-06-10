/**
 * Voice Agent Campaign by ID
 * GET /api/v1/voice-agents/campaigns/[id] - Get campaign with contacts count
 * PATCH /api/v1/voice-agents/campaigns/[id] - Update campaign
 * DELETE /api/v1/voice-agents/campaigns/[id] - Delete campaign
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateRequest } from '@/lib/middleware/auth'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { businessHoursSchema, toBusinessHoursJsonInput } from '@/lib/voice-agent/campaign-schema'
import { z } from 'zod'

const patchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  script: z.string().optional().nullable(),
  autoRemoveDnd: z.boolean().optional(),
  paceCallsPerMin: z.number().int().min(1).max(120).optional(),
  status: z.enum(['draft', 'scheduled', 'running', 'paused', 'completed']).optional(),
  businessHours: businessHoursSchema.optional().nullable(),
})

async function getCampaignOr404(tenantId: string, id: string) {
  const campaign = await prisma.voiceAgentCampaign.findFirst({
    where: { id, tenantId },
    include: {
      agent: { select: { id: true, name: true } },
      _count: { select: { contacts: true } },
    },
  })
  return campaign
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const campaign = await getCampaignOr404(user.tenantId, id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const contacts = await prisma.voiceAgentCampaignContact.findMany({
      where: { campaignId: id },
      orderBy: { createdAt: 'asc' },
      take: 500,
    })

    const { _count, ...rest } = campaign
    return NextResponse.json({
      ...rest,
      contactCount: _count.contacts,
      contacts,
    })
  } catch (error) {
    console.error('[Campaigns] GET [id] error:', error)
    return NextResponse.json({ error: 'Failed to get campaign' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'configure')

    const { id } = await params
    const campaign = await getCampaignOr404(tenantId, id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = patchSchema.parse(body)
    const { businessHours, ...rest } = validated

    const updated = await prisma.voiceAgentCampaign.update({
      where: { id },
      data: {
        ...rest,
        ...(businessHours !== undefined
          ? { businessHoursJson: toBusinessHoursJsonInput(businessHours) }
          : {}),
      },
      include: { agent: { select: { id: true, name: true } } },
    })

    return NextResponse.json(updated)
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 })
    }
    console.error('[Campaigns] PATCH error:', error)
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const campaign = await getCampaignOr404(user.tenantId, id)
    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    if (campaign.status === 'running') {
      return NextResponse.json(
        { error: 'Stop the campaign before deleting' },
        { status: 400 }
      )
    }

    await prisma.voiceAgentCampaign.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Campaigns] DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 })
  }
}
