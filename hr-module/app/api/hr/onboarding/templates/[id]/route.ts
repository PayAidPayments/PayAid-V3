import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const updateOnboardingTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
})

// GET /api/hr/onboarding/templates/[id] - Get a single onboarding template
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const template = await prisma.onboardingTemplate.findFirst({
      where: {
        id: params.id,
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

    return NextResponse.json(template)
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get onboarding template error:', error)
    return NextResponse.json(
      { error: 'Failed to get onboarding template' },
      { status: 500 }
    )
  }
}

// PATCH /api/hr/onboarding/templates/[id] - Update an onboarding template
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const existing = await prisma.onboardingTemplate.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Onboarding template not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = updateOnboardingTemplateSchema.parse(body)

    const updateData: any = {}
    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.isActive !== undefined) updateData.isActive = validated.isActive

    const template = await prisma.onboardingTemplate.update({
      where: { id: params.id },
      data: updateData,
      include: {
        tasks: {
          orderBy: { order: 'asc' },
        },
      },
    })

    return NextResponse.json(template)
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

    console.error('Update onboarding template error:', error)
    return NextResponse.json(
      { error: 'Failed to update onboarding template' },
      { status: 500 }
    )
  }
}

// DELETE /api/hr/onboarding/templates/[id] - Delete an onboarding template
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check HR module license
    const { tenantId } = await requireHRAccess(request)

    const template = await prisma.onboardingTemplate.findFirst({
      where: {
        id: params.id,
        tenantId: tenantId,
      },
      include: {
        _count: {
          select: { instances: true },
        },
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Onboarding template not found' },
        { status: 404 }
      )
    }

    // Check if there are active instances
    if (template._count.instances > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete template. ${template._count.instances} onboarding instance(s) are using this template.`,
        },
        { status: 400 }
      )
    }

    await prisma.onboardingTemplate.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Onboarding template deleted successfully' })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete onboarding template error:', error)
    return NextResponse.json(
      { error: 'Failed to delete onboarding template' },
      { status: 500 }
    )
  }
}
