import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/accounting/reports/pl - Get Profit & Loss statement
export async function GET(request: NextRequest) {
  try {
    // Check Accounting module license
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : new Date()

    // Get revenue from invoices
    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenantId,
        status: 'paid',
        paidAt: {
          gte: start,
          lte: end,
        },
      },
    })

    const revenue = invoices.reduce((sum, inv) => sum + inv.total, 0)

    // Get expenses (would come from expenses table)
    const expenses = 0 // Placeholder

    const grossProfit = revenue - expenses
    const netProfit = grossProfit // Simplified

    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      revenue: {
        total: revenue,
        breakdown: {
          invoices: revenue,
        },
      },
      expenses: {
        total: expenses,
        breakdown: {},
      },
      grossProfit,
      netProfit,
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get P&L error:', error)
    return NextResponse.json(
      { error: 'Failed to generate P&L statement' },
      { status: 500 }
    )
  }
}

