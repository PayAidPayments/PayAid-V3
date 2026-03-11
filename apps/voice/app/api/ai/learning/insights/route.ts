import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { analyzeFeedbackPatterns } from '@/lib/ai/learning'

// GET /api/ai/learning/insights - Get AI learning insights from feedback
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const insights = await analyzeFeedbackPatterns(tenantId)

    return NextResponse.json({
      insights,
      message: insights.length > 0
        ? 'AI learning insights generated from feedback patterns.'
        : 'No significant patterns found yet. Continue providing feedback to improve AI responses.',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get insights error:', error)
    return NextResponse.json(
      { error: 'Failed to generate insights', message: error?.message },
      { status: 500 }
    )
  }
}
