import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const patchBody = z
  .object({
    status: z.enum(['ACKNOWLEDGED', 'RESOLVED']),
  })
  .strict()

/** PATCH — acknowledge or resolve an open delivery-SLA incident */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId, userId } = await requireModuleAccess(request, 'projects')
    const raw = await request.json()
    const body = patchBody.parse(raw)
    const now = new Date()

    const existing = await prisma.serviceSlaIncident.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'SLA incident not found' }, { status: 404 })
    }
    if (existing.status !== 'OPEN' && existing.status !== 'ACKNOWLEDGED') {
      return NextResponse.json({ error: 'Incident is already closed' }, { status: 409 })
    }
    if (existing.status === 'ACKNOWLEDGED' && body.status === 'ACKNOWLEDGED') {
      return NextResponse.json({ error: 'Incident is already acknowledged' }, { status: 409 })
    }

    const row = await prisma.serviceSlaIncident.update({
      where: { id },
      data: {
        status: body.status,
        ...(body.status === 'ACKNOWLEDGED'
          ? { acknowledgedAt: now, acknowledgedById: userId }
          : {}),
        ...(body.status === 'RESOLVED' ? { resolvedAt: now } : {}),
      },
      select: {
        id: true,
        status: true,
        severity: true,
        title: true,
        detail: true,
        detectedAt: true,
        acknowledgedAt: true,
        resolvedAt: true,
        projectId: true,
        servicePackageId: true,
        sourceType: true,
        sourceId: true,
      },
    })

    return NextResponse.json({
      incident: {
        ...row,
        detectedAt: row.detectedAt.toISOString(),
        acknowledgedAt: row.acknowledgedAt ? row.acknowledgedAt.toISOString() : null,
        resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
      },
    })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('PATCH service-sla-incident:', error)
    return NextResponse.json({ error: 'Failed to update SLA incident' }, { status: 500 })
  }
}
