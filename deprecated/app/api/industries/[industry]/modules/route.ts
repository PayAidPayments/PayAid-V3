import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getRecommendedModulesForIndustry, autoConfigureIndustryModules } from '@/lib/industries/module-config'
import { loadIndustryTemplates } from '@/lib/industries/templates'

/**
 * GET /api/industries/[industry]/modules
 * Get recommended modules for an industry
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ industry: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const recommendations = getRecommendedModulesForIndustry(resolvedParams.industry)

    return NextResponse.json({
      industry: resolvedParams.industry,
      ...recommendations,
    })
  } catch (error) {
    console.error('Get industry modules error:', error)
    return NextResponse.json(
      { error: 'Failed to get industry modules' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/industries/[industry]/modules
 * Auto-configure modules for an industry
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ industry: string }> }
) {
  try {
    const resolvedParams = await params
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { industries, selectedModules, tier, industrySubType } = body

    const industryIds = industries || [resolvedParams.industry]

    // If selectedModules is provided, use only those modules
    if (selectedModules && Array.isArray(selectedModules) && selectedModules.length > 0) {
      // Ensure ai-studio is always included
      const modulesToEnable = selectedModules.includes('ai-studio')
        ? selectedModules
        : [...selectedModules, 'ai-studio']

      // Enable only selected modules
      const enabledModules = []
      for (const moduleId of modulesToEnable) {
        const license = await prisma.moduleLicense.upsert({
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
        enabledModules.push(license)
      }

      // Update tenant with industry data
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          industry: industryIds[0],
          industrySubType: industrySubType || null,
          industrySettings: {
            industries: industryIds,
            industrySubType: industrySubType || null,
            enabledModules: modulesToEnable,
            configuredAt: new Date().toISOString(),
            userSelected: true,
          } as any,
          onboardingCompleted: true,
        },
      })

      // Load industry templates
      const templateResult = await loadIndustryTemplates(tenantId, industryIds[0], industrySubType)

      return NextResponse.json({
        success: true,
        enabledModules: modulesToEnable,
        enabledPacks: [],
        templatesLoaded: templateResult.loaded,
      })
    }

    // Otherwise, use auto-configure (all recommended modules)
    // This ensures modules are always enabled even if no selectedModules provided
    const result = await autoConfigureIndustryModules(tenantId, industryIds)

    // Also update tenant with onboarding completion
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        onboardingCompleted: true,
      },
    })

    // Load industry templates
    const templateResult = await loadIndustryTemplates(tenantId, industryIds[0], body.industrySubType)

    return NextResponse.json({
      success: true,
      ...result,
      templatesLoaded: templateResult.loaded,
    })
  } catch (error) {
    console.error('Auto-configure modules error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-configure modules' },
      { status: 500 }
    )
  }
}

