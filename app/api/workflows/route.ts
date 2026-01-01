import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createWorkflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  triggerType: z.enum(['EVENT', 'SCHEDULE', 'MANUAL']),
  triggerEvent: z.string().optional(),
  triggerSchedule: z.string().optional(), // Cron expression
  steps: z.array(z.any()).min(1), // Array of workflow steps
  isTemplate: z.boolean().default(false),
})

// GET /api/workflows - List workflows
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const isActive = searchParams.get('isActive')
    const isTemplate = searchParams.get('isTemplate')
    const triggerType = searchParams.get('triggerType')

    const where: any = { tenantId }
    if (isActive !== null) where.isActive = isActive === 'true'
    if (isTemplate !== null) where.isTemplate = isTemplate === 'true'
    if (triggerType) where.triggerType = triggerType

    const workflows = await prisma.workflow.findMany({
      where,
      include: {
        _count: {
          select: {
            executions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ workflows })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get workflows error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    )
  }
}

// POST /api/workflows - Create workflow
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createWorkflowSchema.parse(body)

    // Validate trigger based on type
    if (validated.triggerType === 'EVENT' && !validated.triggerEvent) {
      return NextResponse.json(
        { error: 'triggerEvent is required for EVENT trigger type' },
        { status: 400 }
      )
    }

    if (validated.triggerType === 'SCHEDULE' && !validated.triggerSchedule) {
      return NextResponse.json(
        { error: 'triggerSchedule is required for SCHEDULE trigger type' },
        { status: 400 }
      )
    }

    const workflow = await prisma.workflow.create({
      data: {
        tenantId,
        name: validated.name,
        description: validated.description,
        triggerType: validated.triggerType,
        triggerEvent: validated.triggerEvent,
        triggerSchedule: validated.triggerSchedule,
        steps: validated.steps,
        isTemplate: validated.isTemplate,
      },
    })

    return NextResponse.json({ workflow }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create workflow error:', error)
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    )
  }
}

