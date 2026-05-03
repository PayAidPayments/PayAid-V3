import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #20: Multi-currency - list currencies. */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const list = await prisma.currency.findMany({
      where: { OR: [{ tenantId }, { tenantId: null }] },
      select: { code: true, name: true, symbol: true, exchangeRate: true, isBase: true },
    })
    return NextResponse.json({
      currencies: list.map((c) => ({ ...c, exchangeRate: Number(c.exchangeRate) })),
      baseCurrency: 'INR',
      note: 'Use for multi-currency payroll when salary structure and run support currency.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
