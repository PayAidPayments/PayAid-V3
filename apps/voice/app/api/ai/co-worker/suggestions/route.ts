import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { generateProactiveSuggestions } from '@/lib/ai/co-worker/proactive-suggestions'

/** GET /api/ai/co-worker/suggestions - Get proactive AI suggestions */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    
    const suggestions = await generateProactiveSuggestions(tenantId, userId)

    return NextResponse.json({ suggestions })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get suggestions' },
      { status: 500 }
    )
  }
}
