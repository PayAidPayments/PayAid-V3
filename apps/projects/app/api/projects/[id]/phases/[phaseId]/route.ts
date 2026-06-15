import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const patchPhaseSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    sortOrder: z.number().int().optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'DONE']).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
  })
  .strict()

// PATCH /api/projects/[id]/phases/[phaseId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { id: projectId, phaseId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const existing = await prisma.projectPhase.findFirst({
      where: { id: phaseId, projectId, project: { tenantId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    const body = await request.json()
    const v = patchPhaseSchema.parse(body)
    if (Object.keys(v).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const phase = await prisma.projectPhase.update({
      where: { id: phaseId },
      data: {
        ...(v.name !== undefined && { name: v.name }),
        ...(v.sortOrder !== undefined && { sortOrder: v.sortOrder }),
        ...(v.status !== undefined && { status: v.status }),
        ...(v.startDate !== undefined && {
          startDate: v.startDate === null ? null : new Date(v.startDate),
        }),
        ...(v.endDate !== undefined && {
          endDate: v.endDate === null ? null : new Date(v.endDate),
        }),
      },
    })

    return NextResponse.json({ phase })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('PATCH project phase error:', error)
    return NextResponse.json({ error: 'Failed to update phase' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/phases/[phaseId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; phaseId: string }> }
) {
  try {
    const { id: projectId, phaseId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const existing = await prisma.projectPhase.findFirst({
      where: { id: phaseId, projectId, project: { tenantId } },
    })
    if (!existing) {
      return NextResponse.json({ error: 'Phase not found' }, { status: 404 })
    }

    await prisma.projectPhase.delete({ where: { id: phaseId } })
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('DELETE project phase error:', error)
    return NextResponse.json({ error: 'Failed to delete phase' }, { status: 500 })
  }
}
