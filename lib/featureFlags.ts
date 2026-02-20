/**
 * PayAid V3 – Feature flags
 * isFeatureEnabled({ key, user, businessId }) using tenant toggles + plan + rollout.
 * Server-only when DB is needed; client can call API that uses this.
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'
import type { AuthUser } from '@/types/auth'

export type FeatureFlagKey =
  | 'ai_dashboard'
  | 'ai_copilot'
  | 'workflows'
  | 'voice_agents'
  | 'marketing_automation'
  | 'multi_currency'
  | 'gst_reports'
  | 'api_access'
  | 'webhooks'
  | string

interface FeatureFlagContext {
  key: FeatureFlagKey
  user?: AuthUser | null
  businessId?: string | null
}

/**
 * Check if a feature is enabled for the given context.
 * Uses: tenant FeatureToggle (featureName = key), then plan defaults.
 */
export async function isFeatureEnabled({
  key,
  user,
  businessId,
}: FeatureFlagContext): Promise<boolean> {
  const tenantId = businessId ?? user?.tenant_id ?? user?.tenantId
  if (!tenantId) return false

  const toggle = await prisma.featureToggle.findUnique({
    where: {
      tenantId_featureName: {
        tenantId,
        featureName: key,
      },
    },
  })
  if (toggle) return toggle.isEnabled

  // Plan-based defaults (optional)
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { subscriptionTier: true, plan: true },
  })
  if (!tenant) return false

  const tier = (tenant.subscriptionTier ?? tenant.plan ?? 'free').toLowerCase()
  // Example: enable AI features on paid tiers
  if (tier === 'enterprise' || tier === 'pro') {
    if (['ai_dashboard', 'ai_copilot', 'workflows', 'api_access'].includes(key))
      return true
  }
  if (tier !== 'free') {
    if (['webhooks', 'multi_currency', 'gst_reports'].includes(key))
      return true
  }

  return false
}
