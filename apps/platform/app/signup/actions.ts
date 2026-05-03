'use server'

import type { ModuleId } from '@payaid/core'
import { prisma } from '@payaid/db'

/** Phase 17: Create tenant and tenant_modules rows for selected modules. */
export async function createTenantWithModules(formData: FormData) {
  const raw = formData.get('selectedModules')
  const selectedModules = (typeof raw === 'string' ? JSON.parse(raw) : []) as ModuleId[]
  const tenant = await prisma.tenant.create({
    data: {
      name: 'New Workspace',
      plan: 'free',
      status: 'active',
    },
  })
  for (const moduleId of selectedModules) {
    await prisma.tenantModule.upsert({
      where: {
        tenantId_moduleId: { tenantId: tenant.id, moduleId },
      },
      create: {
        tenantId: tenant.id,
        moduleId,
        plan: 'free',
        status: 'trial',
      },
      update: {},
    })
  }
  return tenant.id
}
