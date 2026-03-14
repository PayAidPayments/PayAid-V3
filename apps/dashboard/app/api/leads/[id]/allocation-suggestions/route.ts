import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getAllocationSuggestions } from '@/lib/sales-automation/lead-allocation'

/**
 * GET /api/leads/[id]/allocation-suggestions
 * Get top 3 suggested sales reps for a lead
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const resolvedParams = await params
    // Check crm module license
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const contactId = resolvedParams.id
    const suggestions = await getAllocationSuggestions(contactId, tenantId)

    return NextResponse.json({
      success: true,
      suggestions: suggestions.map((s) => ({
        rep: {
          id: s.rep.id,
          name: s.rep.user.name,
          email: s.rep.user.email,
          specialization: s.rep.specialization,
          conversionRate: s.rep.conversionRate,
        },
        score: s.score,
        reasons: s.reasons,
      })),
    })
  } catch (error) {
    console.error('Get allocation suggestions error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get allocation suggestions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
