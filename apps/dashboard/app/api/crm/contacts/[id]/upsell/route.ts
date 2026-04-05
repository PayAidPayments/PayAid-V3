import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { calculateUpsellOpportunity } from '@/lib/ai/upsell-detector'

/**
 * GET /api/crm/contacts/[id]/upsell
 * Calculates upsell opportunity for a specific contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const contactId = id

    const result = await calculateUpsellOpportunity({
      contactId,
      tenantId,
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error(`Error calculating upsell opportunity for ${id}:`, error)
    return NextResponse.json(
      { error: 'Failed to calculate upsell opportunity' },
      { status: 500 }
    )
  }
}
