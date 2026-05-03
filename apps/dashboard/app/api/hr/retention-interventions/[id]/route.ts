import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

const INTERVENTION_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED'] as const

/**
 * PATCH /api/hr/retention-interventions/[id]
 * Update a retention intervention (e.g. status, notes).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id } = await params

    const existing = await prisma.retentionIntervention.findFirst({
      where: { id, tenantId },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Retention intervention not found' }, { status: 404 })
    }

    const body = await request.json()
    const status = typeof body.status === 'string' && INTERVENTION_STATUSES.includes(body.status as any) ? body.status : undefined
    const notes = typeof body.notes === 'string' ? body.notes : body.notes === undefined ? undefined : null
    const completedAt = status === 'COMPLETED' ? new Date() : body.completedAt === null ? null : undefined

    const intervention = await prisma.retentionIntervention.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(completedAt !== undefined && { completedAt }),
      },
    })

    return NextResponse.json({
      id: intervention.id,
      employeeId: intervention.employeeId,
      type: intervention.type,
      status: intervention.status,
      suggestedAction: intervention.suggestedAction,
      costEstimateInr: intervention.costEstimateInr != null ? Number(intervention.costEstimateInr) : null,
      roiEstimate: intervention.roiEstimate,
      notes: intervention.notes,
      createdBy: intervention.createdBy,
      completedAt: intervention.completedAt?.toISOString() ?? null,
      createdAt: intervention.createdAt.toISOString(),
      updatedAt: intervention.updatedAt.toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
