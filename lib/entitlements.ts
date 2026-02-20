/**
 * PayAid V3 – Entitlements (tenant modules + limits from DB)
 * Server-only: uses Prisma.
 */

import 'server-only'
import { prisma } from '@/lib/db/prisma'
import type { ModuleKey } from '@/constants/modules'
import { MODULE_KEYS } from '@/constants/modules'

export interface TenantEntitlements {
  businessId: string
  plan: string
  subscriptionTier: string
  modules: ModuleKey[]
  limits: {
    maxUsers: number
    maxContacts: number
    maxInvoices: number
    maxStorage: number
  }
}

/**
 * Get tenant entitlements (modules + limits) from DB.
 */
export async function getTenantEntitlements(
  businessId: string
): Promise<TenantEntitlements | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      plan: true,
      subscriptionTier: true,
      licensedModules: true,
      maxUsers: true,
      maxContacts: true,
      maxInvoices: true,
      maxStorage: true,
    },
  })
  if (!tenant) return null

  const modules = (tenant.licensedModules ?? []) as string[]
  const allowedModules = modules.filter((m) =>
    (MODULE_KEYS as readonly string[]).includes(m)
  ) as ModuleKey[]

  return {
    businessId: tenant.id,
    plan: tenant.plan,
    subscriptionTier: tenant.subscriptionTier ?? 'free',
    modules: allowedModules,
    limits: {
      maxUsers: tenant.maxUsers ?? 1,
      maxContacts: tenant.maxContacts ?? 50,
      maxInvoices: tenant.maxInvoices ?? 10,
      maxStorage: tenant.maxStorage ?? 1024,
    },
  }
}

/**
 * Check if a module is enabled for a tenant.
 */
export async function isModuleEnabled(
  businessId: string,
  moduleKey: string
): Promise<boolean> {
  const ent = await getTenantEntitlements(businessId)
  if (!ent) return false
  return ent.modules.includes(moduleKey as ModuleKey)
}
