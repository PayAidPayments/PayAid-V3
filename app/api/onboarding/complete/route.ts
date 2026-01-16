import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const completeOnboardingSchema = z.object({
  industries: z.array(z.string()),
  businessComplexity: z.enum(['single', 'multiple-locations', 'multiple-lines']),
  businessUnits: z.array(z.object({
    name: z.string(),
    industryPacks: z.array(z.string()),
    location: z.string().optional(),
  })).optional(),
  goals: z.array(z.string()),
  recommendedModules: z.object({
    baseModules: z.array(z.string()),
    industryPacks: z.array(z.string()),
    recommendedModules: z.array(z.string()),
  }),
})

// POST /api/onboarding/complete - Complete onboarding and configure modules
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = completeOnboardingSchema.parse(body)

    // Update tenant with onboarding data
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        onboardingCompleted: true,
        onboardingData: {
          industries: validated.industries,
          businessComplexity: validated.businessComplexity,
          goals: validated.goals,
        } as any,
      },
    })

    // Enable recommended modules
    const allModules = [
      ...validated.recommendedModules.baseModules,
      ...validated.recommendedModules.industryPacks,
      ...validated.recommendedModules.recommendedModules,
    ]

    // Enable modules for tenant
    for (const moduleId of allModules) {
      await prisma.moduleLicense.upsert({
        where: {
          tenantId_moduleId: {
            tenantId,
            moduleId,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          tenantId,
          moduleId,
          isActive: true,
          activatedAt: new Date(),
        },
      })
    }

    // Create business units if multiple lines
    if (validated.businessComplexity === 'multiple-lines' && validated.businessUnits) {
      for (const unit of validated.businessUnits) {
        await prisma.businessUnit.create({
          data: {
            tenantId,
            name: unit.name,
            location: unit.location,
            industryPacks: unit.industryPacks,
            isActive: true,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      modulesEnabled: allModules.length,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Complete onboarding error:', error)
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    )
  }
}

