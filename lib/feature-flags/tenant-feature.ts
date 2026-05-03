import { prisma } from '@/lib/db/prisma'

export class TenantFeatureDisabledError extends Error {
  constructor(public featureName: string) {
    super(`Feature "${featureName}" is disabled for this tenant`)
    this.name = 'TenantFeatureDisabledError'
  }
}

export async function isTenantFeatureEnabled(tenantId: string, featureName: string): Promise<boolean> {
  const tenantToggle = await prisma.featureToggle.findFirst({
    where: {
      tenantId,
      featureName,
    },
    select: { isEnabled: true },
  })

  if (tenantToggle) return tenantToggle.isEnabled

  const platformToggle = await prisma.featureToggle.findFirst({
    where: {
      tenantId: null,
      featureName,
    },
    select: { isEnabled: true },
  })

  if (platformToggle) return platformToggle.isEnabled

  // Default-on keeps backward compatibility for tenants
  // until toggles are explicitly configured.
  return true
}

export async function assertTenantFeatureEnabled(tenantId: string, featureName: string): Promise<void> {
  const enabled = await isTenantFeatureEnabled(tenantId, featureName)
  if (!enabled) {
    throw new TenantFeatureDisabledError(featureName)
  }
}
