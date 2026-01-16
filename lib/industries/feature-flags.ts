/**
 * Industry Feature Flags Utility
 * Checks if industry-specific features are enabled for a tenant
 */

import { prisma } from '@/lib/db/prisma'
import { getIndustryConfig } from './config'

/**
 * Check if an industry feature is enabled for a tenant
 */
export async function isIndustryFeatureEnabled(
  tenantId: string,
  featureName: string
): Promise<boolean> {
  const feature = await prisma.featureToggle.findUnique({
    where: {
      tenantId_featureName: {
        tenantId,
        featureName,
      },
    },
  })

  return feature?.isEnabled ?? false
}

/**
 * Get all enabled industry features for a tenant
 */
export async function getEnabledIndustryFeatures(tenantId: string): Promise<string[]> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { industry: true },
  })

  if (!tenant?.industry) {
    return []
  }

  const industryConfig = getIndustryConfig(tenant.industry)
  if (!industryConfig) {
    return []
  }

  // Get enabled features from database
  const features = await prisma.featureToggle.findMany({
    where: {
      tenantId,
      featureName: {
        in: industryConfig.industryFeatures,
      },
      isEnabled: true,
    },
    select: {
      featureName: true,
    },
  })

  return features.map(f => f.featureName)
}

/**
 * Check if tenant has access to industry-specific module features
 */
export async function hasIndustryModuleAccess(
  tenantId: string,
  industryId: string,
  featurePrefix: string
): Promise<boolean> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { industry: true },
  })

  // Check if tenant's industry matches
  if (tenant?.industry !== industryId) {
    return false
  }

  // Check if any feature with this prefix is enabled
  const enabledFeatures = await getEnabledIndustryFeatures(tenantId)
  return enabledFeatures.some(f => f.startsWith(featurePrefix))
}

/**
 * Require industry feature (throws error if not enabled)
 */
export async function requireIndustryFeature(
  tenantId: string,
  featureName: string
): Promise<void> {
  const isEnabled = await isIndustryFeatureEnabled(tenantId, featureName)
  if (!isEnabled) {
    throw new Error(`Industry feature "${featureName}" is not enabled for this tenant`)
  }
}

