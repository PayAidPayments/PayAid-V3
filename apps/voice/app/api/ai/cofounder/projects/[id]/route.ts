import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/license'
import { z } from 'zod'

const updateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  instructions: z.string().max(4000).optional().nullable(),
  contextNotes: z.string().max(8000).optional().nullable(),
})

/**
 * GET /api/ai/cofounder/projects/[id]
 * Get a single AI project
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const project = await prisma.aIProject.findFirst({
      where: { id: params.id, tenantId, userId },
      include: { _count: { select: { conversations: true } } },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }
    console.error('[COFOUNDER PROJECTS] GET [id] error:', error)
    return NextResponse.json(
      { error: 'Failed to get project' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/ai/cofounder/projects/[id]
 * Update project name and/or instructions
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const project = await prisma.aIProject.findFirst({
      where: { id: params.id, tenantId, userId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateProjectSchema.parse(body)

    const updated = await prisma.aIProject.update({
      where: { id: params.id },
      data: {
        ...(validated.name !== undefined && { name: validated.name.trim() }),
        ...(validated.instructions !== undefined && {
          instructions: validated.instructions === null || validated.instructions === ''
            ? null
            : validated.instructions.trim(),
        }),
        ...(validated.contextNotes !== undefined && {
          contextNotes: validated.contextNotes === null || validated.contextNotes === ''
            ? null
            : validated.contextNotes.trim(),
        }),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }
    console.error('[COFOUNDER PROJECTS] PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ai/cofounder/projects/[id]
 * Delete project (conversations are unlinked via onDelete: SetNull on projectId)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const project = await prisma.aIProject.findFirst({
      where: { id: params.id, tenantId, userId },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    await prisma.aIProject.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }
    console.error('[COFOUNDER PROJECTS] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
