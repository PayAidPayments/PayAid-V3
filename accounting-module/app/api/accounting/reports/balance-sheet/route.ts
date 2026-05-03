import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/accounting/reports/balance-sheet - Get Balance Sheet
export async function GET(request: NextRequest) {
  try {
    // Check Accounting module license
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const asOfDate = searchParams.get('asOfDate')

    const asOf = asOfDate ? new Date(asOfDate) : new Date()

    // Get assets (simplified)
    const assets = {
      current: {
        cash: 0, // Would come from bank reconciliation
        accountsReceivable: 0, // Unpaid invoices
        inventory: 0, // Product inventory value
      },
      fixed: {
        equipment: 0,
        property: 0,
      },
    }

    // Calculate accounts receivable
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        tenantId: tenantId,
        status: { in: ['sent', 'overdue'] },
        createdAt: { lte: asOf },
      },
    })
    assets.current.accountsReceivable = unpaidInvoices.reduce((sum, inv) => sum + inv.total, 0)

    // Get liabilities
    const liabilities = {
      current: {
        accountsPayable: 0, // Unpaid bills
        shortTermDebt: 0,
      },
      longTerm: {
        longTermDebt: 0,
      },
    }

    // Get equity
    const equity = {
      capital: 0,
      retainedEarnings: 0,
    }

    const totalAssets = Object.values(assets.current).reduce((a, b) => a + b, 0) +
                       Object.values(assets.fixed).reduce((a, b) => a + b, 0)
    const totalLiabilities = Object.values(liabilities.current).reduce((a, b) => a + b, 0) +
                            Object.values(liabilities.longTerm).reduce((a, b) => a + b, 0)
    const totalEquity = Object.values(equity).reduce((a, b) => a + b, 0)

    return NextResponse.json({
      asOf: asOf.toISOString(),
      assets,
      liabilities,
      equity,
      totals: {
        assets: totalAssets,
        liabilities: totalLiabilities,
        equity: totalEquity,
        balance: totalAssets - (totalLiabilities + totalEquity),
      },
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get balance sheet error:', error)
    return NextResponse.json(
      { error: 'Failed to generate balance sheet' },
      { status: 500 }
    )
  }
}

