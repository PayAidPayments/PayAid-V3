import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createPhaseSchema = z
  .object({
    name: z.string().min(1).max(200),
    sortOrder: z.number().int().optional(),
    status: z.enum(['PLANNED', 'ACTIVE', 'DONE']).optional(),
    startDate: z.string().datetime().nullable().optional(),
    endDate: z.string().datetime().nullable().optional(),
  })
  .strict()

async function assertProject(tenantId: string, projectId: string) {
  const p = await prisma.project.findFirst({
    where: { id: projectId, tenantId },
    select: { id: true },
  })
  return p
}

// POST /api/projects/[id]/phases
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const project = await assertProject(tenantId, projectId)
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const v = createPhaseSchema.parse(body)

    const phase = await prisma.projectPhase.create({
      data: {
        projectId,
        name: v.name,
        sortOrder: v.sortOrder ?? 0,
        status: v.status ?? 'PLANNED',
        startDate: v.startDate != null ? new Date(v.startDate) : undefined,
        endDate: v.endDate != null ? new Date(v.endDate) : undefined,
      },
    })

    return NextResponse.json({ phase }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    console.error('POST project phase error:', error)
    return NextResponse.json({ error: 'Failed to create phase' }, { status: 500 })
  }
}
