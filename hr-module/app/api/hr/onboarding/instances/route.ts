import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createOnboardingInstanceSchema = z.object({
  employeeId: z.string(),
  templateId: z.string(),
})

// GET /api/hr/onboarding/instances - List all onboarding instances
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      tenantId: tenantId,
    }

    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const [instances, total] = await Promise.all([
      prisma.onboardingInstance.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              firstName: true,
              lastName: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          tasks: {
            include: {
              task: true,
              // assigneeId is just a string, not a relation
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.onboardingInstance.count({ where }),
    ])

    return NextResponse.json({
      instances,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get onboarding instances error:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding instances' },
      { status: 500 }
    )
  }
}

// POST /api/hr/onboarding/instances - Create a new onboarding instance
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createOnboardingInstanceSchema.parse(body)

    // Verify employee belongs to tenant
    const employee = await prisma.employee.findFirst({
      where: {
        id: validated.employeeId,
        tenantId: tenantId,
      },
    })

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    // Verify template belongs to tenant
    const template = await prisma.onboardingTemplate.findFirst({
      where: {
        id: validated.templateId,
        tenantId: tenantId,
      },
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Onboarding template not found' },
        { status: 404 }
      )
    }

    // Check if instance already exists
    const existing = await prisma.onboardingInstance.findFirst({
      where: {
        employeeId: validated.employeeId,
        templateId: validated.templateId,
        status: { not: 'COMPLETED' },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Active onboarding instance already exists for this employee' },
        { status: 400 }
      )
    }

    // Create onboarding instance
    const instance = await prisma.onboardingInstance.create({
      data: {
        employeeId: validated.employeeId,
        templateId: validated.templateId,
        status: 'IN_PROGRESS',
        startDate: new Date(),
        tenantId: tenantId,
      },
    })

    // Create instance tasks from template
    const instanceTasks = await Promise.all(
      template.tasks.map((task) =>
        prisma.onboardingInstanceTask.create({
          data: {
            instanceId: instance.id,
            taskId: task.id,
            status: 'PENDING',
          },
        })
      )
    )

    return NextResponse.json(
      {
        instance,
        tasks: instanceTasks,
      },
      { status: 201 }
    )
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

    console.error('Create onboarding instance error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding instance' },
      { status: 500 }
    )
  }
}
