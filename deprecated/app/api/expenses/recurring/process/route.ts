/**
 * Process Recurring Expenses API Route
 * POST /api/expenses/recurring/process - Process all recurring expenses and generate new ones
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { processRecurringExpenses } from '@/lib/automation/recurring-expenses'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const result = await processRecurringExpenses(tenantId)

    return NextResponse.json({
      success: true,
      message: `Processed ${result.processed} recurring expenses, generated ${result.generated} new expenses`,
      data: result,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to process recurring expenses', message: error.message },
      { status: 500 }
    )
  }
}
