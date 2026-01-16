/**
 * Industry Module Configuration System
 * Manages module enablement, configuration, and industry-specific settings
 */

import { prisma } from '@/lib/db/prisma'
import { getIndustryConfig, getAllIndustries } from './config'

export interface ModuleConfig {
  moduleId: string
  isEnabled: boolean
  config: Record<string, any>
  industryFeatures: string[]
}

export interface IndustryModuleConfig {
  industryId: string
  coreModules: string[]
  industryPacks: string[]
  enabledFeatures: string[]
  moduleConfigs: ModuleConfig[]
}

/**
 * Get module configuration for a tenant based on their industry
 */
export async function getTenantModuleConfig(tenantId: string): Promise<IndustryModuleConfig | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      industry: true,
      industrySettings: true,
    }
  })

  if (!tenant || !tenant.industry) {
    return null
  }

  const industryConfig = getIndustryConfig(tenant.industry)
  if (!industryConfig) {
    return null
  }

  // Get enabled modules from ModuleLicense
  const licenses = await prisma.moduleLicense.findMany({
    where: {
      tenantId,
      isActive: true,
    },
    select: {
      moduleId: true,
    }
  })

  const enabledModuleIds = licenses.map(l => l.moduleId)

  // Get feature toggles
  const featureToggles = await prisma.featureToggle.findMany({
    where: {
      tenantId,
      isEnabled: true,
    },
    select: {
      featureName: true,
    }
  })

  const enabledFeatures = featureToggles.map(f => f.featureName)

  // Build module configs
  const moduleConfigs: ModuleConfig[] = industryConfig.coreModules.map(moduleId => ({
    moduleId,
    isEnabled: enabledModuleIds.includes(moduleId),
    config: {},
    industryFeatures: industryConfig.industryFeatures.filter(f => f.startsWith(`${moduleId}_`)),
  }))

  return {
    industryId: tenant.industry,
    coreModules: industryConfig.coreModules,
    industryPacks: industryConfig.industryPacks,
    enabledFeatures,
    moduleConfigs,
  }
}

/**
 * Auto-configure modules for an industry
 */
export async function autoConfigureIndustryModules(
  tenantId: string,
  industryId: string | string[]
): Promise<{ enabledModules: string[], enabledPacks: string[] }> {
  const industries = Array.isArray(industryId) ? industryId : [industryId]
  
  const allCoreModules = new Set<string>()
  const allIndustryPacks = new Set<string>()
  const allFeatures = new Set<string>()

  // Collect modules and features from all selected industries
  for (const id of industries) {
    const config = getIndustryConfig(id)
    if (config) {
      config.coreModules.forEach(m => allCoreModules.add(m))
      config.industryPacks.forEach(p => allIndustryPacks.add(p))
      config.industryFeatures.forEach(f => allFeatures.add(f))
    }
  }

  // Always include base modules
  const BASE_MODULES = ['crm', 'finance', 'communication', 'analytics']
  BASE_MODULES.forEach(m => allCoreModules.add(m))

  // Enable modules via ModuleLicense
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
    await prisma.moduleLicense.upsert({
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
  }

  // Enable features via FeatureToggle
  for (const featureName of Array.from(allFeatures)) {
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

  // Update tenant with industry data
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      industry: industries[0], // Primary industry
      industrySettings: {
        industries,
        enabledModules: Array.from(allCoreModules),
        enabledIndustryPacks: Array.from(allIndustryPacks),
        enabledFeatures: Array.from(allFeatures),
        configuredAt: new Date().toISOString(),
      } as any,
    },
  })

  return {
    enabledModules: Array.from(allCoreModules),
    enabledPacks: Array.from(allIndustryPacks),
  }
}

/**
 * Get recommended modules for an industry
 */
export function getRecommendedModulesForIndustry(industryId: string): {
  coreModules: string[]
  industryPacks: string[]
  optionalModules: string[]
} {
  const config = getIndustryConfig(industryId)
  if (!config) {
    return {
      coreModules: ['crm', 'finance'],
      industryPacks: [],
      optionalModules: [],
    }
  }

  // Optional modules are all modules not in core
  const allModules = getAllIndustries().flatMap(i => i.coreModules)
  const optionalModules = Array.from(new Set(allModules)).filter(
    m => !config.coreModules.includes(m)
  )

  return {
    coreModules: config.coreModules,
    industryPacks: config.industryPacks,
    optionalModules,
  }
}

/**
 * Check if a module is enabled for a tenant
 */
export async function isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
  const license = await prisma.moduleLicense.findUnique({
    where: {
      tenantId_moduleId: {
        tenantId,
        moduleId,
      },
    },
  })

  return license?.isActive ?? false
}

/**
 * Enable a module for a tenant
 */
export async function enableModule(tenantId: string, moduleId: string): Promise<void> {
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

/**
 * Disable a module for a tenant
 */
export async function disableModule(tenantId: string, moduleId: string): Promise<void> {
  await prisma.moduleLicense.updateMany({
    where: {
      tenantId,
      moduleId,
    },
    data: {
      isActive: false,
    },
  })
}

