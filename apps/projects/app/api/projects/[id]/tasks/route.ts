import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

// GET /api/projects/[id]/tasks — tasks for a single project (Kanban, embeds)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params
    const { tenantId } = await requireModuleAccess(request, 'projects')

    const project = await prisma.project.findFirst({
      where: { id: projectId, tenantId },
      select: { id: true, name: true },
    })
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const tasks = await prisma.projectTask.findMany({
      where: { projectId },
      include: {
        project: { select: { id: true, name: true, code: true } },
        phase: { select: { id: true, name: true } },
        milestone: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        dependsOnTask: {
          select: { id: true, name: true, status: true },
        },
        _count: { select: { timeEntries: true } },
      },
      orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { updatedAt: 'desc' }],
    })

    return NextResponse.json({ tasks, project })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('GET /api/projects/[id]/tasks error:', error)
    return NextResponse.json({ error: 'Failed to list tasks' }, { status: 500 })
  }
}
