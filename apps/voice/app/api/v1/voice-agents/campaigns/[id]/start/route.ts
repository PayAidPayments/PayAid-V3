/**
 * Start campaign (sequential dialer)
 * POST /api/v1/voice-agents/campaigns/[id]/start
 * Sets status to 'running'. If autoRemoveDnd, marks DND contacts as dnd_skipped before start.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateRequest } from '@/lib/middleware/auth'
import { checkDndBatch, normalizePhoneForDnd } from '@/lib/dnd'

async function getCampaignOr404(tenantId: string, id: string) {
  return prisma.voiceAgentCampaign.findFirst({
    where: { id, tenantId },
    include: { _count: { select: { contacts: true } } },
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

    if (campaign.status === 'running') {
      return NextResponse.json({ message: 'Campaign already running', campaign }, { status: 200 })
    }

    if (campaign._count.contacts === 0) {
      return NextResponse.json(
        { error: 'Add contacts (upload CSV) before starting' },
        { status: 400 }
      )
    }

    // Phase 0: Auto-remove DND — mark DND contacts as dnd_skipped before launch
    if (campaign.autoRemoveDnd) {
      const pendingContacts = await prisma.voiceAgentCampaignContact.findMany({
        where: { campaignId: id, status: 'pending' },
        select: { id: true, phone: true },
      })
      const phones = pendingContacts.map((c) => c.phone)
      if (phones.length > 0) {
        const dndMap = await checkDndBatch(phones)
        const dndContactIds = pendingContacts
          .filter((c) => dndMap.get(normalizePhoneForDnd(c.phone)))
          .map((c) => c.id)
        if (dndContactIds.length > 0) {
          await prisma.voiceAgentCampaignContact.updateMany({
            where: { id: { in: dndContactIds } },
            data: { status: 'dnd_skipped' },
          })
        }
      }
    }

    await prisma.voiceAgentCampaign.update({
      where: { id },
      data: {
        status: 'running',
        startedAt: new Date(),
      },
    })

    const updated = await prisma.voiceAgentCampaign.findUnique({
      where: { id },
      include: { agent: { select: { id: true, name: true } } },
    })

    return NextResponse.json({
      message: 'Campaign started. Outbound calls will be placed by the dialer.',
      campaign: updated,
    })
  } catch (error) {
    console.error('[Campaigns] Start error:', error)
    return NextResponse.json({ error: 'Failed to start campaign' }, { status: 500 })
  }
}
