import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

const INTERVENTION_TYPES = ['SALARY_REVIEW', 'ROLE_CHANGE', 'RETENTION_BONUS', 'ONE_ON_ONE', 'PIP', 'PROMOTION', 'OTHER'] as const
const INTERVENTION_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DEFERRED'] as const

/**
 * GET /api/hr/employees/[id]/retention-interventions
 * List retention interventions for an employee.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true },
    })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const interventions = await prisma.retentionIntervention.findMany({
      where: { employeeId, tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(
      interventions.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        type: r.type,
        status: r.status,
        suggestedAction: r.suggestedAction,
        costEstimateInr: r.costEstimateInr != null ? Number(r.costEstimateInr) : null,
        roiEstimate: r.roiEstimate,
        notes: r.notes,
        createdBy: r.createdBy,
        completedAt: r.completedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }))
    )
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}

/**
 * POST /api/hr/employees/[id]/retention-interventions
 * Create a retention intervention for an employee.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true },
    })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const body = await request.json()
    const type = typeof body.type === 'string' && INTERVENTION_TYPES.includes(body.type as any) ? body.type : 'OTHER'
    const status = typeof body.status === 'string' && INTERVENTION_STATUSES.includes(body.status as any) ? body.status : 'PENDING'
    const suggestedAction = typeof body.suggestedAction === 'string' ? body.suggestedAction : null
    const costEstimateInr = typeof body.costEstimateInr === 'number' ? body.costEstimateInr : body.costEstimateInr != null ? Number(body.costEstimateInr) : null
    const roiEstimate = typeof body.roiEstimate === 'number' ? body.roiEstimate : body.roiEstimate != null ? Number(body.roiEstimate) : null
    const notes = typeof body.notes === 'string' ? body.notes : null

    const intervention = await prisma.retentionIntervention.create({
      data: {
        tenantId,
        employeeId,
        type,
        status,
        suggestedAction,
        costEstimateInr: costEstimateInr != null ? costEstimateInr : undefined,
        roiEstimate: roiEstimate != null ? roiEstimate : undefined,
        notes,
        createdBy: userId ?? undefined,
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
