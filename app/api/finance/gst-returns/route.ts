/**
 * Finance GST Returns API Route
 * GET /api/finance/gst-returns - Calculate GST returns for period
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, GSTReturn } from '@/types/base-modules'
import { formatINR } from '@/lib/currency'

/**
 * Calculate GST returns for a period
 * GET /api/finance/gst-returns?organizationId=xxx&period=monthly&month=1&year=2026
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const period = searchParams.get('period') as GSTReturn['period'] || 'monthly'
  const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1), 10)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()), 10)

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  // Calculate date range for the period
  const startDate = new Date(year, month - 1, 1)
  const endDate = period === 'monthly'
    ? new Date(year, month, 0, 23, 59, 59)
    : new Date(year, month + 2, 0, 23, 59, 59)

  // Get all invoices for the period
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: organizationId,
      invoiceDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        not: 'cancelled',
      },
    },
  })

  // Get all expenses for the period (for input GST credit)
  const expenses = await prisma.expense.findMany({
    where: {
      tenantId: organizationId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: 'approved',
    },
  })

  // Calculate GST collected from invoices
  const gstBreakdownBySlab: Record<string, number> = {}
  let totalTaxableValue = 0
  let totalGSTCollected = 0

  invoices.forEach((invoice) => {
    const taxBreakdown = JSON.parse(invoice.taxBreakdown || '{}')
    const breakdownByRate = taxBreakdown.breakdownByRate || {}
    
    Object.keys(breakdownByRate).forEach((rate) => {
      gstBreakdownBySlab[rate] = (gstBreakdownBySlab[rate] || 0) + breakdownByRate[rate]
    })

    totalTaxableValue += Number(invoice.subtotal)
    totalGSTCollected += Number(invoice.tax)
  })

  // Calculate input GST from expenses (simplified - assumes 18% GST on expenses)
  const totalInputGST = expenses.reduce((sum, expense) => {
    // Simplified calculation - in production, track GST on each expense
    return sum + (Number(expense.amount) * 0.18)
  }, 0)

  // Calculate net GST payable
  const netGSTPayableINR = totalGSTCollected - totalInputGST

  // Calculate filing deadline (20th of next month for monthly, end of next quarter for quarterly)
  const filingDeadline = period === 'monthly'
    ? new Date(year, month, 20)
    : new Date(year, month + 3, 0)

  const gstReturn: GSTReturn = {
    id: `gstr-${year}-${month}-${period}`,
    organizationId,
    period,
    filingDeadline,
    invoicesSummary: {
      totalTaxableValue,
      totalGSTCollected,
      gstBreakdownBySlab,
    },
    expenseSummary: {
      totalInputGST,
    },
    netGSTPayableINR,
    status: 'pending',
  }

  const response: ApiResponse<GSTReturn> = {
    success: true,
    statusCode: 200,
    data: gstReturn,
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
