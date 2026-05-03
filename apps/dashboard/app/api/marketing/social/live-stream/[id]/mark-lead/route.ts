import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { processInboundLead } from '@/lib/crm/inbound-orchestration'

// POST /api/marketing/social/live-stream/:id/mark-lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'marketing')
    const { id } = await params
    const socialActivity = (prisma as any).socialActivityEvent

    const event = await socialActivity.findFirst({
      where: { id, tenantId },
    })
    if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

    if (event.leadContactId) {
      const existing = await prisma.contact.findFirst({
        where: { id: event.leadContactId, tenantId },
        select: { id: true, name: true, stage: true, type: true, status: true },
      })
      return NextResponse.json({ contact: existing, existed: true })
    }

    const leadName =
      event.actorName?.trim() ||
      event.actorHandle?.trim() ||
      `${event.platform.toUpperCase()} Lead`

    const inbound = await processInboundLead({
      tenantId,
      actorUserId: userId,
      dedupePolicy: 'reject_duplicate',
      source: {
        sourceChannel: 'social_live_stream',
        sourceSubchannel: String(event.platform || 'unknown'),
        sourceRef: event.id,
        capturedBy: userId,
        rawMetadata: {
          platform: event.platform,
          actorHandle: event.actorHandle,
          actorAvatar: event.actorAvatar,
          action: event.action,
          objectType: event.objectType,
          objectId: event.objectId,
          objectText: event.objectText,
          eventAt: event.eventAt,
        },
      },
      legacySourceLabel: 'social-live-stream',
      contact: {
        name: leadName,
        type: 'lead',
        stage: 'prospect',
        status: 'active',
        notes: `Created from social event: ${event.action}${event.objectText ? ` — ${event.objectText}` : ''}`,
        tags: ['social', 'live-stream', event.platform].filter(Boolean),
      },
    })

    if (!inbound.ok || inbound.error) {
      if (inbound.error?.code === 'CONTACT_LIMIT') {
        return NextResponse.json({ error: inbound.error.message }, { status: 403 })
      }
      return NextResponse.json(
        { error: inbound.error?.message || 'Failed to create lead contact' },
        { status: 500 }
      )
    }

    const lead = {
      id: inbound.contact.id,
      name: inbound.contact.name,
      stage: inbound.contact.stage,
      type: inbound.contact.type,
      status: inbound.contact.status,
    }

    await socialActivity.update({
      where: { id: event.id },
      data: { leadContactId: lead.id },
    })

    return NextResponse.json({ contact: lead, existed: false })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Mark lead from live stream error:', error)
    return NextResponse.json({ error: 'Failed to mark as lead' }, { status: 500 })
  }
}

