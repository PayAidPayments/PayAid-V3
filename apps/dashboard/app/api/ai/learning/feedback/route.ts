import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { recordFeedback } from '@/lib/ai/learning'
import { z } from 'zod'

const feedbackSchema = z.object({
  type: z.enum(['positive', 'negative', 'correction']),
  context: z.string().min(1),
  userInput: z.string().min(1),
  aiResponse: z.string().min(1),
  correctedResponse: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

// POST /api/ai/learning/feedback - Record AI feedback for learning
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = feedbackSchema.parse(body)

    await recordFeedback(tenantId, userId, validated)

    return NextResponse.json({
      success: true,
      message: 'Feedback recorded. AI will learn from this interaction.',
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Record feedback error:', error)
    return NextResponse.json(
      { error: 'Failed to record feedback', message: error?.message },
      { status: 500 }
    )
  }
}
