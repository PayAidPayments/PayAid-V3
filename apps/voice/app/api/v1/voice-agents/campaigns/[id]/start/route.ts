/**
 * Start campaign (sequential dialer)
 * POST /api/v1/voice-agents/campaigns/[id]/start
 * Sets status to 'running'. If autoRemoveDnd, marks DND contacts as dnd_skipped before start.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { checkDndBatch, normalizePhoneForDnd } from '@/lib/dnd'
import { pickupNextCampaignContact } from '@/lib/voice-agent/campaign-dialer'

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
    const { tenantId } = await requireVoiceAccess(request, 'operate')

    const { id } = await params
    const campaign = await getCampaignOr404(tenantId, id)
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

    let firstDial = null
    if (process.env.VOICE_AUTO_DIAL_ON_START === '1') {
      firstDial = await pickupNextCampaignContact(prisma, {
        tenantId,
        campaignId: id,
      })
    }

    return NextResponse.json({
      message: 'Campaign started. Use POST …/campaigns/[id]/tick to place outbound calls.',
      campaign: updated,
      firstDial,
    })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[Campaigns] Start error:', error)
    return NextResponse.json({ error: 'Failed to start campaign' }, { status: 500 })
  }
}
