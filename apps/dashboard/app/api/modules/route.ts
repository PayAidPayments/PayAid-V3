import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getRecommendedModules } from '@/lib/onboarding/industry-presets'
import { ALL_LICENSE_MODULE_ID_SET } from '@/lib/modules/catalog'
import { getCanonicalLicenseModules } from '@/lib/taxonomy/license-module-catalog'
import { resolveLicenseModuleId } from '@/lib/tenant/module-license-filter'
import { TOP_LEVEL_BUSINESS_SUITES, PLATFORM_CAPABILITIES, WORKSPACE_TOOLS } from '@/lib/taxonomy/business-os-taxonomy'
import { shouldIncludeLegacyModuleFields } from '@/lib/taxonomy/canonical-api-mode'

// GET /api/modules - Get all modules with recommendations
export async function GET(request: NextRequest) {
  try {
    const includeLegacy = shouldIncludeLegacyModuleFields()
    const { tenantId } = await requireModuleAccess(request, 'crm')

    // Get tenant onboarding and canonical licensed modules.
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        onboardingData: true,
        onboardingCompleted: true,
        licensedModules: true,
      },
    })

    const activeModuleIds = new Set<string>((tenant?.licensedModules as string[] | undefined) ?? [])

    // Get recommended modules based on onboarding
    let recommendedModuleIds: string[] = []
    if (tenant?.onboardingCompleted && tenant.onboardingData) {
      const onboardingData = tenant.onboardingData as any
      const recommendations = getRecommendedModules(
        onboardingData.industries || [],
        onboardingData.goals || [],
        onboardingData.businessComplexity || 'single'
      )
      const rawRecommended = [
        ...recommendations.baseModules,
        ...recommendations.industryPacks,
        ...recommendations.recommendedModules,
      ]
      recommendedModuleIds = Array.from(
        new Set(
          rawRecommended
            .map((id: string) => resolveLicenseModuleId(id))
            .filter((id: string) => ALL_LICENSE_MODULE_ID_SET.has(id))
        )
      )
    }

    const canonicalModules = getCanonicalLicenseModules().map((m) => ({
      id: m.id,
      name: m.name,
      description: m.description,
      category: m.category,
      isActive: activeModuleIds.has(m.id),
      isRecommended: recommendedModuleIds.includes(m.id),
    }))

    const recommended = canonicalModules.filter((m) => m.isRecommended)
    const suiteModules = canonicalModules.filter((m) => m.category === 'suite')
    const featureModules = canonicalModules.filter((m) => m.category === 'feature')
    const capabilityModules = canonicalModules.filter((m) => m.category === 'capability')

    return NextResponse.json({
      taxonomy: {
        topLevelSuites: TOP_LEVEL_BUSINESS_SUITES,
        platformCapabilities: PLATFORM_CAPABILITIES,
        workspaceTools: WORKSPACE_TOOLS,
      },
      canonical: {
        recommended,
        all: canonicalModules,
        suites: suiteModules,
        features: featureModules,
        capabilities: capabilityModules,
      },
      ...(includeLegacy
        ? {
            compatibility: { deprecated: true, mode: 'legacy-fields-included' as const },
            // Backward-compatible fields
            recommended,
            all: canonicalModules,
            base: suiteModules,
            industry: [],
          }
        : {}),
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get modules error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get modules',
        canonical: { recommended: [], all: [], suites: [], features: [], capabilities: [] },
        ...(shouldIncludeLegacyModuleFields()
          ? {
              compatibility: { deprecated: true, mode: 'legacy-fields-included' as const },
              recommended: [],
              all: [],
              base: [],
              industry: [],
            }
          : {}),
      },
      { status: 500 }
    )
  }
}
