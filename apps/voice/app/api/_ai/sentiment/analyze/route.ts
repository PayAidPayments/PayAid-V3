import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { SentimentAnalysisService } from '@/lib/ai/sentiment-analysis'
import { z } from 'zod'

const analyzeSchema = z.object({
  text: z.string().min(1),
  context: z.object({
    contactName: z.string().optional(),
    dealStage: z.string().optional(),
  }).optional(),
})

/**
 * POST /api/ai/sentiment/analyze
 * Analyze sentiment of text
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const { text, context } = analyzeSchema.parse(body)

    const service = new SentimentAnalysisService()
    const result = await service.analyzeSentiment(text, context)

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('[Sentiment Analysis] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}
