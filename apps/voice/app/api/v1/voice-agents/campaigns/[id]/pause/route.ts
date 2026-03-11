/**
 * Pause campaign
 * POST /api/v1/voice-agents/campaigns/[id]/pause
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateRequest } from '@/lib/middleware/auth'

async function getCampaignOr404(tenantId: string, id: string) {
  return prisma.voiceAgentCampaign.findFirst({
    where: { id, tenantId },
  })
}

export async function POST(
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

    if (campaign.status !== 'running') {
      return NextResponse.json({ message: 'Campaign was not running', campaign }, { status: 200 })
    }

    await prisma.voiceAgentCampaign.update({
      where: { id },
      data: { status: 'paused' },
    })

    const updated = await prisma.voiceAgentCampaign.findUnique({
      where: { id },
      include: { agent: { select: { id: true, name: true } } },
    })

    return NextResponse.json({
      message: 'Campaign paused',
      campaign: updated,
    })
  } catch (error) {
    console.error('[Campaigns] Pause error:', error)
    return NextResponse.json({ error: 'Failed to pause campaign' }, { status: 500 })
  }
}
