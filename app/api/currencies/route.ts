/**
 * Currencies API Route
 * GET /api/currencies - List supported currencies
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { SUPPORTED_CURRENCIES } from '@/lib/currency/converter'

/** GET /api/currencies - List all supported currencies */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'finance')

    const currencies = Object.values(SUPPORTED_CURRENCIES).map((currency) => ({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      decimals: currency.decimals,
    }))

    return NextResponse.json({
      success: true,
      currencies,
      count: currencies.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to list currencies', message: error.message },
      { status: 500 }
    )
  }
}
