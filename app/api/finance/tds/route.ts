/**
 * Finance TDS (Tax Deducted at Source) API
 * GET /api/finance/tds - Summary and deductions list (optional: quarter, year)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Due dates for TDS returns (quarter end + 31 days for 26Q/27Q, 24Q is annual) */
function getTDSDueDates(year: number) {
  return [
    { form: '26Q', period: `Q1 (Apr-Jun ${year})`, dueDate: new Date(year, 6, 31), description: 'TDS on salary (if applicable)' },
    { form: '26Q', period: `Q2 (Jul-Sep ${year})`, dueDate: new Date(year, 9, 31), description: 'TDS on salary' },
    { form: '26Q', period: `Q3 (Oct-Dec ${year})`, dueDate: new Date(year, 11, 31), description: 'TDS on salary' },
    { form: '26Q', period: `Q4 (Jan-Mar ${year + 1})`, dueDate: new Date(year + 1, 0, 31), description: 'TDS on salary' },
    { form: '24Q', period: `Q4 (Jan-Mar ${year + 1})`, dueDate: new Date(year + 1, 4, 31), description: 'TDS on non-salary (payments other than salary)' },
  ]
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const { searchParams } = new URL(request.url)
    const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!, 10) : null
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : new Date().getFullYear()

    const where: { tenantId: string; tdsAmount?: { not: null }; invoiceDate?: { gte?: Date; lte?: Date } } = {
      tenantId,
      tdsAmount: { not: null },
    }

    if (quarter != null && quarter >= 1 && quarter <= 4) {
      const startMonth = (quarter - 1) * 3
      where.invoiceDate = {
        gte: new Date(year, startMonth, 1),
        lte: new Date(year, startMonth + 3, 0, 23, 59, 59),
      }
    }

    const invoicesWithTDS = await prisma.invoice.findMany({
      where,
      select: {
        id: true,
        invoiceNumber: true,
        customerName: true,
        customerGSTIN: true,
        invoiceDate: true,
        total: true,
        tdsType: true,
        tdsTax: true,
        tdsAmount: true,
        status: true,
      },
      orderBy: { invoiceDate: 'desc' },
      take: 500,
    })

    const deductions = invoicesWithTDS.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customerName ?? '-',
      customerGSTIN: inv.customerGSTIN ?? null,
      invoiceDate: inv.invoiceDate,
      total: Number(inv.total),
      tdsType: inv.tdsType ?? null,
      tdsTax: inv.tdsTax ?? null,
      tdsAmount: inv.tdsAmount != null ? Number(inv.tdsAmount) : 0,
      status: inv.status,
    }))

    const totalTDS = deductions.reduce((sum, d) => sum + (d.tdsAmount || 0), 0)
    const currentYear = new Date().getFullYear()
    const dueDates = getTDSDueDates(currentYear).map((d) => ({
      ...d,
      dueDate: d.dueDate.toISOString(),
    }))

    return NextResponse.json({
      summary: {
        totalTDSDeducted: Math.round(totalTDS * 100) / 100,
        deductionCount: deductions.length,
        byType: deductions.reduce<Record<string, number>>((acc, d) => {
          const t = d.tdsType || 'Other'
          acc[t] = (acc[t] || 0) + (d.tdsAmount || 0)
          return acc
        }, {}),
      },
      dueDates,
      deductions,
      filters: { quarter, year },
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
