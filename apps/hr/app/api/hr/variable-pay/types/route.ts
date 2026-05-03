import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/** Feature #21: Variable pay types. */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'hr')
    return NextResponse.json({
      types: [
        { id: 'COMMISSION', name: 'Commission' },
        { id: 'BONUS_ANNUAL', name: 'Annual Bonus' },
        { id: 'BONUS_QUARTERLY', name: 'Quarterly Bonus' },
        { id: 'INCENTIVE', name: 'Incentive' },
        { id: 'PROFIT_SHARING', name: 'Profit Sharing' },
      ],
      note: 'Add to salary structure and payroll run; integrate with performance/sales data.',
      generatedAt: new Date().toISOString(),
    })
  } catch (error: unknown) {
    return handleLicenseError(error)
  }
}
