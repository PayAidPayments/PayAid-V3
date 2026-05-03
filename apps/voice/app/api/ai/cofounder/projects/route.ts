import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/license'
import { z } from 'zod'

const createProjectSchema = z.object({
  name: z.string().min(1).max(200),
  instructions: z.string().max(4000).optional(),
  contextNotes: z.string().max(8000).optional(),
})

/**
 * GET /api/ai/cofounder/projects
 * List AI projects for the current tenant/user
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const projects = await prisma.aIProject.findMany({
      where: { tenantId, userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        instructions: true,
        contextNotes: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { conversations: true } },
      },
    })

    return NextResponse.json({ projects })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }
    console.error('[COFOUNDER PROJECTS] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to list projects' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/ai/cofounder/projects
 * Create a new AI project
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = createProjectSchema.parse(body)

    const project = await prisma.aIProject.create({
      data: {
        tenantId,
        userId,
        name: validated.name.trim(),
        instructions: validated.instructions?.trim() || undefined,
        contextNotes: validated.contextNotes?.trim() || undefined,
      },
    })

    return NextResponse.json(project, { status: 201 })
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
    console.error('[COFOUNDER PROJECTS] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    )
  }
}
