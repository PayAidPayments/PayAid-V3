import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// POST /api/marketing/social/live-stream/:id/mark-lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
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
    const lead = await prisma.contact.create({
      data: {
        tenantId,
        name: leadName,
        type: 'lead',
        stage: 'prospect',
        status: 'active',
        source: 'social-live-stream',
        sourceData: {
          platform: event.platform,
          actorHandle: event.actorHandle,
          actorAvatar: event.actorAvatar,
          action: event.action,
          objectType: event.objectType,
          objectId: event.objectId,
          objectText: event.objectText,
          eventId: event.id,
          eventAt: event.eventAt,
        },
        notes: `Created from social event: ${event.action}${event.objectText ? ` — ${event.objectText}` : ''}`,
        tags: ['social', 'live-stream', event.platform].filter(Boolean),
      },
      select: { id: true, name: true, stage: true, type: true, status: true },
    })

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

