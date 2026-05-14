import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'
import { writeLeadAuditEvent } from '@/lib/lead-intelligence/audit'
import { trackLeadIntelligenceEvent } from '@/lib/lead-intelligence/telemetry'

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'lead-intelligence')
    const { id } = await context.params
    const body = (await request.json()) as { name?: unknown; archived?: unknown }

    const brief = await prisma.leadBrief.findFirst({
      where: { id, tenantId },
      include: {
        segments: { orderBy: { updatedAt: 'desc' }, take: 1 },
      },
    })
    if (!brief) {
      return NextResponse.json({ ok: false, error: 'Saved search not found' }, { status: 404 })
    }

    const segment = brief.segments[0]
    if (!segment) {
      return NextResponse.json({ ok: false, error: 'Saved search has no segment' }, { status: 409 })
    }

    const nameProvided = body && typeof body === 'object' && 'name' in body && body.name !== undefined
    const nameTrimmed = nameProvided ? String(body.name).trim() : ''
    const hasArchived = typeof body?.archived === 'boolean'
    if (!nameProvided && !hasArchived) {
      return NextResponse.json({ ok: false, error: 'Provide name and/or archived' }, { status: 400 })
    }
    if (nameProvided && nameTrimmed.length < 2) {
      return NextResponse.json({ ok: false, error: 'name must be at least 2 characters' }, { status: 400 })
    }

    let nextStatus: typeof segment.status | undefined
    if (hasArchived) {
      if (body.archived) nextStatus = 'ARCHIVED'
      else if (segment.status === 'ARCHIVED') nextStatus = 'DRAFT'
    }

    const segmentData = {
      ...(nameProvided ? { name: nameTrimmed } : {}),
      ...(nextStatus !== undefined ? { status: nextStatus } : {}),
    }
    const needsSegmentUpdate = Object.keys(segmentData).length > 0

    const { updatedBrief, segmentStatus } = await prisma.$transaction(async (tx) => {
      const b = await tx.leadBrief.update({
        where: { id: brief.id },
        data: nameProvided ? { name: nameTrimmed } : {},
      })
      if (!needsSegmentUpdate) {
        return { updatedBrief: b, segmentStatus: segment.status }
      }
      const segRow = await tx.leadSegment.update({
        where: { id: segment.id },
        data: segmentData,
        select: { status: true },
      })
      return { updatedBrief: b, segmentStatus: segRow.status }
    })

    if (nameProvided) {
      await writeLeadAuditEvent({
        tenantId,
        actorId: userId,
        action: 'search_renamed',
        entityType: 'lead_saved_search',
        entityId: brief.id,
        metadata: { from: brief.name, to: updatedBrief.name },
      })
      trackLeadIntelligenceEvent('search_renamed')
    }
    if (hasArchived) {
      await writeLeadAuditEvent({
        tenantId,
        actorId: userId,
        action: Boolean(body.archived) ? 'search_archived' : 'search_unarchived',
        entityType: 'lead_saved_search',
        entityId: brief.id,
        metadata: { segmentId: segment.id },
      })
      trackLeadIntelligenceEvent(Boolean(body.archived) ? 'search_archived' : 'search_unarchived')
    }

    return NextResponse.json({
      ok: true,
      id: updatedBrief.id,
      name: updatedBrief.name,
      status: segmentStatus,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('[lead-intelligence/saved-searches/:id] PATCH failed:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'lead-intelligence')
    const { id } = await context.params
    const brief = await prisma.leadBrief.findFirst({
      where: { id, tenantId },
      select: { id: true },
    })
    if (!brief) {
      return NextResponse.json({ ok: false, error: 'Saved search not found' }, { status: 404 })
    }
    await prisma.leadBrief.delete({ where: { id: brief.id } })
    await writeLeadAuditEvent({
      tenantId,
      actorId: userId,
      action: 'search_deleted',
      entityType: 'lead_saved_search',
      entityId: brief.id,
    })
    trackLeadIntelligenceEvent('search_deleted')
    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('[lead-intelligence/saved-searches/:id] DELETE failed:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}
