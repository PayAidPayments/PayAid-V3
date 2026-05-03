import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { convertCurrency } from '@/lib/currency/converter'

/**
 * GET /api/analytics/currency-reporting
 * Multi-currency reporting in analytics
 * Returns revenue breakdown by currency with conversion to base currency
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'analytics')
    
    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenantId found in request' },
        { status: 400 }
      )
    }

    // Get tenant's default currency
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { defaultCurrency: true, supportedCurrencies: true },
    })

    const baseCurrency = tenant?.defaultCurrency || 'INR'
    const supportedCurrencies = tenant?.supportedCurrencies || [baseCurrency]

    // Get date range from query params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1)
    const end = endDate ? new Date(endDate) : new Date()

    // Aggregate invoices by currency
    const invoicesByCurrency = await prisma.invoice.groupBy({
      by: ['currency'],
      where: {
        tenantId,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _count: { id: true },
      _sum: { total: true },
      _avg: { total: true },
    })

    // Get exchange rates for conversion
    const exchangeRates = await prisma.currencyExchangeRate.findMany({
      where: {
        tenantId: tenantId,
        fromCurrency: { in: supportedCurrencies },
        toCurrency: baseCurrency,
        rateDate: {
          lte: end,
        },
        isActive: true,
      },
      orderBy: { rateDate: 'desc' },
      distinct: ['fromCurrency', 'toCurrency'],
    })

    // Create exchange rate map (use latest rate for each currency)
    const rateMap: Record<string, number> = { [baseCurrency]: 1 }
    exchangeRates.forEach((rate) => {
      if (!rateMap[rate.fromCurrency]) {
        rateMap[rate.fromCurrency] = rate.rate
      }
    })

    // Process currency breakdown
    const currencyBreakdown = invoicesByCurrency.map((item) => {
      const currency = item.currency || baseCurrency
      const total = Number(item._sum.total || 0)
      const exchangeRate = rateMap[currency] || 1
      const convertedTotal = convertCurrency(total, currency, baseCurrency, exchangeRate)

      return {
        currency,
        invoiceCount: item._count.id,
        totalAmount: total,
        averageAmount: Number(item._avg.total || 0),
        exchangeRate,
        convertedAmount: convertedTotal,
        baseCurrency,
      }
    })

    // Calculate totals
    const totalInBaseCurrency = currencyBreakdown.reduce(
      (sum, item) => sum + item.convertedAmount,
      0
    )

    // Get paid invoices by currency
    const paidInvoicesByCurrency = await prisma.invoice.groupBy({
      by: ['currency'],
      where: {
        tenantId,
        status: 'paid',
        paidAt: {
          gte: start,
          lte: end,
        },
      },
      _sum: { total: true },
    })

    const paidByCurrency = paidInvoicesByCurrency.map((item) => {
      const currency = item.currency || baseCurrency
      const total = Number(item._sum.total || 0)
      const exchangeRate = rateMap[currency] || 1
      const convertedTotal = convertCurrency(total, currency, baseCurrency, exchangeRate)

      return {
        currency,
        paidAmount: total,
        convertedPaidAmount: convertedTotal,
      }
    })

    return NextResponse.json({
      baseCurrency,
      supportedCurrencies,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      currencyBreakdown,
      totals: {
        totalInvoices: currencyBreakdown.reduce((sum, item) => sum + item.invoiceCount, 0),
        totalAmount: totalInBaseCurrency,
        baseCurrency,
      },
      paidByCurrency,
      exchangeRates: rateMap,
    })
  } catch (error: any) {
    console.error('Currency reporting error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch currency reporting data', details: error.message },
      { status: 500 }
    )
  }
}
