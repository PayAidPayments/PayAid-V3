/**
 * Finance E-Invoicing & E-Way Bill API (stub)
 * GET /api/finance/e-invoice - List invoices with IRN/E-Way status (placeholder)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)

    const invoices = await prisma.invoice.findMany({
      where: { tenantId, status: { not: 'cancelled' } },
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        total: true,
        customerName: true,
        placeOfSupply: true,
        gstAmount: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: limit,
    })

    const list = invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      invoiceDate: inv.invoiceDate,
      total: Number(inv.total),
      customerName: inv.customerName ?? null,
      placeOfSupply: inv.placeOfSupply ?? null,
      gstAmount: inv.gstAmount != null ? Number(inv.gstAmount) : null,
      irnNumber: null as string | null,
      irnAckDate: null as string | null,
      ewayBillNumber: null as string | null,
      ewayValidUpto: null as string | null,
    }))

    return NextResponse.json({ invoices: list })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
