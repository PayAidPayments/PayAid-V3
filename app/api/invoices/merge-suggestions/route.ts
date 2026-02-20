/**
 * Invoice Merge Suggestions API Route
 * GET /api/invoices/merge-suggestions - Get merge suggestions
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getMergeSuggestions } from '@/lib/invoices/smart-merge'

/** GET /api/invoices/merge-suggestions - Get suggestions */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const searchParams = request.nextUrl.searchParams
    const customerId = searchParams.get('customerId') || undefined

    const suggestions = await getMergeSuggestions(tenantId, customerId)

    return NextResponse.json({
      success: true,
      suggestions,
    })
  } catch (error: any) {
    console.error('Get merge suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to get suggestions', message: error.message },
      { status: 500 }
    )
  }
}
