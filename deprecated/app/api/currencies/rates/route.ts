/**
 * Currency Exchange Rates API Route
 * GET /api/currencies/rates - Get exchange rates
 * POST /api/currencies/rates - Update exchange rates
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { fetchExchangeRate, fetchExchangeRates } from '@/lib/currency/converter'
import { z } from 'zod'

const updateRatesSchema = z.object({
  baseCurrency: z.string().default('INR'),
  targetCurrencies: z.array(z.string()).optional(),
  forceRefresh: z.boolean().default(false),
})

/** GET /api/currencies/rates - Get exchange rates */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const searchParams = request.nextUrl.searchParams
    const baseCurrency = searchParams.get('base') || 'INR'
    const targetCurrency = searchParams.get('target')
    const date = searchParams.get('date') // Optional: get historical rate

    if (targetCurrency) {
      // Get single exchange rate
      const rate = await prisma.currencyExchangeRate.findFirst({
        where: {
          tenantId,
          fromCurrency: baseCurrency,
          toCurrency: targetCurrency,
          isActive: true,
          ...(date ? { rateDate: new Date(date) } : {}),
        },
        orderBy: { rateDate: 'desc' },
      })

      if (!rate) {
        // Try to fetch from API
        const apiKey = process.env.OPENEXCHANGERATES_API_KEY
        const fetchedRate = await fetchExchangeRate(baseCurrency, targetCurrency, apiKey)
        if (fetchedRate) {
          // Save to database
          await prisma.currencyExchangeRate.create({
            data: {
              tenantId,
              fromCurrency: baseCurrency,
              toCurrency: targetCurrency,
              rate: fetchedRate,
              source: 'api',
            },
          })
          return NextResponse.json({
            success: true,
            fromCurrency: baseCurrency,
            toCurrency: targetCurrency,
            rate: fetchedRate,
            date: new Date().toISOString(),
          })
        }
        return NextResponse.json(
          { error: 'Exchange rate not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        fromCurrency: rate.fromCurrency,
        toCurrency: rate.toCurrency,
        rate: rate.rate,
        date: rate.rateDate.toISOString(),
        source: rate.source,
      })
    } else {
      // Get all rates for base currency
      const rates = await prisma.currencyExchangeRate.findMany({
        where: {
          tenantId,
          fromCurrency: baseCurrency,
          isActive: true,
        },
        orderBy: { rateDate: 'desc' },
        distinct: ['toCurrency'],
      })

      const ratesMap: Record<string, number> = {}
      for (const rate of rates) {
        ratesMap[rate.toCurrency] = rate.rate
      }

      return NextResponse.json({
        success: true,
        baseCurrency,
        rates: ratesMap,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to get exchange rates', message: error.message },
      { status: 500 }
    )
  }
}

/** POST /api/currencies/rates - Update exchange rates */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')
    const body = await request.json()
    const validated = updateRatesSchema.parse(body)

    const apiKey = process.env.OPENEXCHANGERATES_API_KEY
    const targetCurrencies = validated.targetCurrencies || [
      'USD',
      'EUR',
      'GBP',
      'JPY',
      'CNY',
      'AUD',
      'CAD',
      'SGD',
    ]

    // Fetch rates from API
    const rates = await fetchExchangeRates(
      validated.baseCurrency,
      targetCurrencies,
      apiKey
    )

    // Save to database
    const savedRates = []
    for (const [currency, rate] of Object.entries(rates)) {
      const saved = await prisma.currencyExchangeRate.create({
        data: {
          tenantId,
          fromCurrency: validated.baseCurrency,
          toCurrency: currency,
          rate,
          source: 'api',
        },
      })
      savedRates.push(saved)
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${savedRates.length} exchange rates`,
      rates: savedRates.map((r) => ({
        fromCurrency: r.fromCurrency,
        toCurrency: r.toCurrency,
        rate: r.rate,
        date: r.rateDate.toISOString(),
      })),
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to update exchange rates', message: error.message },
      { status: 500 }
    )
  }
}
