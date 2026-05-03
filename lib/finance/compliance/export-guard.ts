// @ts-nocheck — exportInvoice model gate vs Prisma schema.
import { prisma } from '@/lib/db/prisma'

export async function getOverdueExportBlockStatus(tenantId: string): Promise<{ blocked: boolean; overdueCount: number }> {
  const oneYearAgo = new Date()
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

  const overdueCount = await prisma.exportInvoice.count({
    where: {
      tenantId,
      status: 'delayed',
      invoiceDate: { lt: oneYearAgo },
    },
  })

  return {
    blocked: overdueCount > 0,
    overdueCount,
  }
}
