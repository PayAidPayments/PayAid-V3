'use server'

import { prisma } from '@payaid/db'

/** Phase 17: Create tenant and tenant_module for marketing (standalone signup). */
export async function createMarketingTenant() {
  const tenant = await prisma.tenant.create({
    data: {
      name: 'New Workspace',
      plan: 'free',
      status: 'active',
    },
  })
  await prisma.tenantModule.upsert({
    where: {
      tenantId_moduleId: { tenantId: tenant.id, moduleId: 'marketing' },
    },
    create: {
      tenantId: tenant.id,
      moduleId: 'marketing',
      plan: 'free',
      status: 'trial',
    },
    update: {},
  })
  return tenant.id
}
