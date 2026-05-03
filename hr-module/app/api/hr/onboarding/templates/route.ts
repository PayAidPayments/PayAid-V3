import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createOnboardingTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
})

// GET /api/hr/onboarding/templates - List all onboarding templates
export async function GET(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive')

    const where: any = {
      tenantId: tenantId,
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const templates = await prisma.onboardingTemplate.findMany({
      where,
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { instances: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get onboarding templates error:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding templates' },
      { status: 500 }
    )
  }
}

// POST /api/hr/onboarding/templates - Create a new onboarding template
export async function POST(request: NextRequest) {
  try {
    // Check HR module license
    const { tenantId } = await requireModuleAccess(request, 'hr')

    const body = await request.json()
    const validated = createOnboardingTemplateSchema.parse(body)

    const template = await prisma.onboardingTemplate.create({
      data: {
        name: validated.name,
        description: validated.description,
        isActive: validated.isActive,
        tenantId: tenantId,
      },
    })

    return NextResponse.json(template, { status: 201 })
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

    console.error('Create onboarding template error:', error)
    return NextResponse.json(
      { error: 'Failed to create onboarding template' },
      { status: 500 }
    )
  }
}
