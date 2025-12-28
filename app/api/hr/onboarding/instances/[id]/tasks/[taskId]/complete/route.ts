import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// PUT /api/hr/onboarding/instances/[id]/tasks/[taskId]/complete - Mark task as complete
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
  const resolvedParams = await params
    // Check HR module license
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')

    const instanceTask = await prisma.onboardingInstanceTask.findFirst({
      where: {
        instanceId: resolvedParams.id,
        taskId: resolvedParams.taskId,
        instance: {
          tenantId: tenantId,
        },
      },
    })

    if (!instanceTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    if (instanceTask.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Task already completed' },
        { status: 400 }
      )
    }

    // Update task status
    const updated = await prisma.onboardingInstanceTask.update({
      where: { id: instanceTask.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        assigneeId: userId,
      },
    })

    // Check if all tasks are completed
    const allTasks = await prisma.onboardingInstanceTask.findMany({
      where: {
        instanceId: resolvedParams.id,
      },
    })

    const allCompleted = allTasks.every((t) => t.status === 'COMPLETED')

    if (allCompleted) {
      await prisma.onboardingInstance.update({
        where: { id: resolvedParams.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Complete onboarding task error:', error)
    return NextResponse.json(
      { error: 'Failed to complete task' },
      { status: 500 }
    )
  }
}
