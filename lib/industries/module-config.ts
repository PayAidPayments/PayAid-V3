/**
 * Industry Module Configuration System
 * Manages module enablement, configuration, and industry-specific settings
 */

import { prisma } from '@/lib/db/prisma'
import { getIndustryConfig } from './config'
import { ALL_LICENSE_MODULE_IDS } from '@/lib/modules/catalog'
import { normalizeSelectedModuleIds, resolveLicenseModuleId } from '@/lib/tenant/module-license-filter'

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

  // Always include foundation suites in canonical licensed-module form.
  const BASE_FOUNDATION_MODULES = [
    'crm',
    'finance',
    'marketing',
    'inventory',
    'projects',
    'hr',
    'communication',
    'analytics',
    'ai-studio',
  ]
  BASE_FOUNDATION_MODULES.forEach((m) => allCoreModules.add(m))

  // Normalize to canonical licensed module ids only.
  const normalizedCoreModules = normalizeSelectedModuleIds(Array.from(allCoreModules))
  const normalizedIndustryPacks = normalizeSelectedModuleIds(Array.from(allIndustryPacks))

  // Enable modules via ModuleLicense
  const moduleLicenses = []
  for (const moduleId of normalizedCoreModules) {
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
  for (const packId of normalizedIndustryPacks) {
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
          enabledIndustryPacks: normalizedIndustryPacks,
        enabledFeatures: Array.from(allFeatures),
        configuredAt: new Date().toISOString(),
      } as any,
    },
  })

  return {
    enabledModules: normalizedCoreModules,
    enabledPacks: normalizedIndustryPacks,
  }
}

/**
 * Get recommended modules for an industry
 */
export function getRecommendedModulesForIndustry(industryId: string): {
  suites: string[]
  capabilities: string[]
  optionalSuites: string[]
  canonical: {
    suites: string[]
    capabilities: string[]
    optionalSuites: string[]
  }
  compatibility: {
    deprecated: true
    coreModules: string[]
    industryPacks: string[]
    optionalModules: string[]
  }
  coreModules: string[]
  industryPacks: string[]
  optionalModules: string[]
} {
  const config = getIndustryConfig(industryId)
  if (!config) {
    const fallbackSuites = normalizeSelectedModuleIds(['crm', 'finance', 'ai-studio'])
    const optionalSuites = ALL_LICENSE_MODULE_IDS.filter((id) => !fallbackSuites.includes(id))
    return {
      suites: fallbackSuites,
      capabilities: [],
      optionalSuites,
      canonical: { suites: fallbackSuites, capabilities: [], optionalSuites },
      compatibility: {
        deprecated: true,
        coreModules: fallbackSuites,
        industryPacks: [],
        optionalModules: optionalSuites,
      },
      coreModules: fallbackSuites,
      industryPacks: [],
      optionalModules: optionalSuites,
    }
  }

  const suites = normalizeSelectedModuleIds(config.coreModules)
  const capabilities = normalizeSelectedModuleIds(config.industryPacks)
  const optionalSuites = ALL_LICENSE_MODULE_IDS.filter(
    (m) => !suites.includes(m) && !capabilities.includes(m)
  )

  return {
    suites,
    capabilities,
    optionalSuites,
    canonical: { suites, capabilities, optionalSuites },
    compatibility: {
      deprecated: true,
      coreModules: suites,
      industryPacks: capabilities,
      optionalModules: optionalSuites,
    },
    // Deprecated aliases retained for compatibility.
    coreModules: suites,
    industryPacks: capabilities,
    optionalModules: optionalSuites,
  }
}

/**
 * Check if a module is enabled for a tenant
 */
export async function isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
  const canonicalModuleId = resolveLicenseModuleId(moduleId)
  const license = await prisma.moduleLicense.findUnique({
    where: {
      tenantId_moduleId: {
        tenantId,
        moduleId: canonicalModuleId,
      },
    },
  })

  return license?.isActive ?? false
}

/**
 * Enable a module for a tenant
 */
export async function enableModule(tenantId: string, moduleId: string): Promise<void> {
  const canonicalModuleId = resolveLicenseModuleId(moduleId)
  await prisma.moduleLicense.upsert({
    where: {
      tenantId_moduleId: {
        tenantId,
        moduleId: canonicalModuleId,
      },
    },
    update: {
      isActive: true,
    },
    create: {
      tenantId,
      moduleId: canonicalModuleId,
      isActive: true,
      activatedAt: new Date(),
    },
  })
}

/**
 * Disable a module for a tenant
 */
export async function disableModule(tenantId: string, moduleId: string): Promise<void> {
  const canonicalModuleId = resolveLicenseModuleId(moduleId)
  await prisma.moduleLicense.updateMany({
    where: {
      tenantId,
      moduleId: canonicalModuleId,
    },
    data: {
      isActive: false,
    },
  })
}

