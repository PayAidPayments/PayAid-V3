import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { normalizeSelectedModuleIds } from '@/lib/tenant/module-license-filter'
import { shouldIncludeLegacyModuleFields } from '@/lib/taxonomy/canonical-api-mode'

/**
 * POST /api/industries/custom/modules
 * Configure modules for a custom industry based on AI recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const includeLegacy = shouldIncludeLegacyModuleFields()
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { industryName, coreModules, industryFeatures } = body

    if (!industryName || !coreModules || !Array.isArray(coreModules)) {
      return NextResponse.json(
        { error: 'Industry name and core modules are required' },
        { status: 400 }
      )
    }

    // Ensure ai-studio is always included
    const modulesToEnable = normalizeSelectedModuleIds(
      coreModules.includes('ai-studio') ? coreModules : [...coreModules, 'ai-studio']
    )

    // Enable modules via ModuleLicense
    for (const moduleId of modulesToEnable) {
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

    // Enable features via FeatureToggle
    if (industryFeatures && Array.isArray(industryFeatures)) {
      for (const featureName of industryFeatures) {
        await prisma.featureToggle.upsert({
          where: {
            tenantId_featureName: {
              tenantId,
              featureName,
            },
          },
          update: {
            isEnabled: true,
          },
          create: {
            tenantId,
            featureName,
            isEnabled: true,
          },
        })
      }
    }

    // Update tenant with custom industry data
    await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        industry: 'custom',
        industrySubType: industryName,
        industrySettings: {
          industryName,
          enabledModules: modulesToEnable,
          enabledFeatures: industryFeatures || [],
          configuredAt: new Date().toISOString(),
          isCustom: true,
        } as any,
      },
    })

    return NextResponse.json({
      success: true,
      canonical: {
        enabledModules: modulesToEnable,
        enabledFeatures: industryFeatures || [],
      },
      ...(includeLegacy
        ? {
            compatibility: {
              deprecated: true,
              enabledModules: modulesToEnable,
              enabledFeatures: industryFeatures || [],
            },
            enabledModules: modulesToEnable,
            enabledFeatures: industryFeatures || [],
          }
        : {}),
      industryName,
    })
  } catch (error) {
    console.error('Custom industry module configuration error:', error)
    return NextResponse.json(
      { error: 'Failed to configure custom industry modules' },
      { status: 500 }
    )
  }
}

