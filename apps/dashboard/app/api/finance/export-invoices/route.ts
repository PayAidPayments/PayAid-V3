import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { getOverdueExportBlockStatus } from '@/lib/finance/compliance/export-guard'

function computeRealizationDeadline(invoiceDate: Date, isInrExport: boolean): Date {
  const d = new Date(invoiceDate)
  d.setMonth(d.getMonth() + (isInrExport ? 18 : 15))
  return d
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()

    const { blocked, overdueCount } = await getOverdueExportBlockStatus(tenantId)
    if (blocked) {
      return NextResponse.json(
        {
          error: 'EXPORT_BLOCKED_OVERDUE_REALIZATION',
          message: `Cannot create new export invoice. ${overdueCount} prior exports are delayed beyond one year.`,
        },
        { status: 422 }
      )
    }

    const invoiceDate = new Date(body.invoiceDate || new Date())
    const isInrExport = Boolean(body.isInrExport)

    const created = await prisma.exportInvoice.create({
      data: {
        tenantId,
        invoiceId: body.invoiceId || null,
        invoiceNumber: body.invoiceNumber,
        invoiceDate,
        shipmentDate: body.shipmentDate ? new Date(body.shipmentDate) : null,
        isInrExport,
        realizationDeadline: computeRealizationDeadline(invoiceDate, isInrExport),
        status: 'pending_realization',
      },
    })

    return NextResponse.json({ exportInvoice: created }, { status: 201 })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
