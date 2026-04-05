// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const [totals, compliant, blockedItc, blockedReturns, overdueExports] = await Promise.all([
      prisma.invoice.count({ where: { tenantId } }),
      prisma.invoice.count({
        where: {
          tenantId,
          gstValidation: { not: null },
          itcStatus: { in: ['matched', 'claimed'] as any },
        },
      }),
      prisma.invoice.aggregate({
        where: { tenantId, itcStatus: 'blocked' as any },
        _sum: { total: true },
      }),
      prisma.gstrValidation.count({
        where: { tenantId, status: { in: ['blocked', 'late_fee_pending'] } },
      }),
      prisma.exportInvoice.count({
        where: { tenantId, status: 'delayed' },
      }),
    ])

    const complianceScore = totals > 0 ? Math.round((compliant / totals) * 100) : 100

    return NextResponse.json({
      totals,
      compliant,
      complianceScore,
      blockedItcAmount: Number(blockedItc._sum.total || 0),
      blockedReturns,
      overdueExports,
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
