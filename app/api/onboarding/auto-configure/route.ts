import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getIndustryConfig, getRecommendedModules } from '@/lib/industries/config'

// POST /api/onboarding/auto-configure - Auto-configure modules based on industry
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { industries, industrySubTypes, goals } = body

    if (!industries || !Array.isArray(industries) || industries.length === 0) {
      return NextResponse.json(
        { error: 'Industries required' },
        { status: 400 }
      )
    }

    // Get all recommended modules for selected industries
    const allCoreModules = new Set<string>()
    const allIndustryPacks = new Set<string>()

    for (const industryId of industries) {
      const config = getIndustryConfig(industryId)
      if (config) {
        config.coreModules.forEach((m) => allCoreModules.add(m))
        config.industryPacks.forEach((p) => allIndustryPacks.add(p))
      }
    }

    // Always include base modules
    const BASE_MODULES = ['crm', 'finance', 'communication', 'analytics']
    BASE_MODULES.forEach((m) => allCoreModules.add(m))

    // Enable core modules via ModuleLicense
    const moduleLicenses = []
    for (const moduleId of Array.from(allCoreModules)) {
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
      moduleLicenses.push(license)
    }

    // Enable industry packs
    for (const packId of Array.from(allIndustryPacks)) {
      const license = await prisma.moduleLicense.upsert({
        where: {
          tenantId_moduleId: {
            tenantId,
            moduleId: packId,
          },
        },
        update: {
          isActive: true,
        },
        create: {
          tenantId,
          moduleId: packId,
          isActive: true,
          activatedAt: new Date(),
        },
      })
      moduleLicenses.push(license)
    }

    // Update tenant with industry data
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        industry: industries[0], // Primary industry
        industrySubType: industrySubTypes?.[0],
        industrySettings: {
          industries,
          industrySubTypes,
          goals,
          enabledModules: Array.from(allCoreModules),
          enabledIndustryPacks: Array.from(allIndustryPacks),
        } as any,
        onboardingCompleted: true,
        onboardingData: {
          industries,
          industrySubTypes,
          goals,
          autoConfigured: true,
          configuredAt: new Date().toISOString(),
        } as any,
      },
    })

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        industry: tenant.industry,
        industrySubType: tenant.industrySubType,
      },
      enabledModules: Array.from(allCoreModules),
      enabledIndustryPacks: Array.from(allIndustryPacks),
      licensesCreated: moduleLicenses.length,
    })
  } catch (error: any) {
    console.error('Auto-configure error:', error)
    return NextResponse.json(
      { error: 'Failed to auto-configure modules' },
      { status: 500 }
    )
  }
}

