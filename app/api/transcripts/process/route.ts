/**
 * Transcript Processing API
 * Auto-extracts action items, key points, and summaries from transcripts
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { processTranscript } from '@/lib/ai/transcript-processor'
import { z } from 'zod'

const processSchema = z.object({
  callId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = processSchema.parse(body)

    // Process the transcript
    const analysis = await processTranscript(validated.callId, tenantId)

    return NextResponse.json({
      success: true,
      analysis,
      message: `Extracted ${analysis.actionItems.length} action items and ${analysis.keyPoints.length} key points.`,
    })
  } catch (error) {
    console.error('[TRANSCRIPT_PROCESS] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to process transcript',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
