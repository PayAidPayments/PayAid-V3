import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  assignedToRole: z.string().min(1), // HR, MANAGER, IT, ADMIN, etc.
  dueDaysRelative: z.number().min(0), // Days from start date
  order: z.number().min(0),
})

// GET /api/hr/onboarding/templates/[id]/tasks - Get tasks for a template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const resolvedParams = await params
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const template = await prisma.onboardingTemplate.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Onboarding template not found' },
        { status: 404 }
      )
    }

    const tasks = await prisma.onboardingTask.findMany({
      where: {
        templateId: resolvedParams.id,
      },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ tasks })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get onboarding tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding tasks' },
      { status: 500 }
    )
  }
}

// POST /api/hr/onboarding/templates/[id]/tasks - Add a task to template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const template = await prisma.onboardingTemplate.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Onboarding template not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = createTaskSchema.parse(body)

    const task = await prisma.onboardingTask.create({
      data: {
        templateId: resolvedParams.id,
        title: validated.title,
        description: validated.description,
        assignedToRole: validated.assignedToRole,
        dueDaysRelative: validated.dueDaysRelative,
        order: validated.order,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create onboarding task error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding task' },
      { status: 500 }
    )
  }
}
