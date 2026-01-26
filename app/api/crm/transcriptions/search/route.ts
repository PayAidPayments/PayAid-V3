import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { searchTranscripts } from '@/lib/ai/transcription-service'
import { z } from 'zod'

const SearchQuerySchema = z.object({
  q: z.string().min(1),
  contactId: z.string().optional(),
  dealId: z.string().optional(),
  dateFrom: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  dateTo: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 50)),
})

/**
 * GET /api/crm/transcriptions/search
 * Search call/meeting transcripts
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const query = SearchQuerySchema.parse({
      q: searchParams.get('q'),
      contactId: searchParams.get('contactId'),
      dealId: searchParams.get('dealId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      limit: searchParams.get('limit'),
    })

    const results = await searchTranscripts(query.q, tenantId, {
      contactId: query.contactId,
      dealId: query.dealId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      limit: query.limit,
    })

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Error searching transcripts:', error)
    return NextResponse.json(
      { error: 'Failed to search transcripts' },
      { status: 500 }
    )
  }
}
