import { prisma } from '@/lib/db/prisma'

type ComplianceKeys = {
  gspApiKey?: string
  gspApiSecret?: string
  irpUsername?: string
  irpPassword?: string
}

export async function getTenantComplianceKeys(tenantId: string): Promise<ComplianceKeys> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { invoiceSettings: true },
  })
  const settings = (tenant?.invoiceSettings || {}) as Record<string, any>
  return (settings.complianceKeys || {}) as ComplianceKeys
}

export async function setTenantComplianceKeys(tenantId: string, keys: ComplianceKeys): Promise<void> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { invoiceSettings: true },
  })
  const settings = ((tenant?.invoiceSettings || {}) as Record<string, any>) || {}
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      invoiceSettings: {
        ...settings,
        complianceKeys: {
          ...(settings.complianceKeys || {}),
          ...keys,
        },
      },
    },
  })
}
