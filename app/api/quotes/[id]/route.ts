/**
 * Quote API Route
 * GET /api/quotes/[id] - Get quote
 * PUT /api/quotes/[id] - Update quote status
 * DELETE /api/quotes/[id] - Delete quote
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { QuoteGeneratorService } from '@/lib/quotes/quote-generator'
import { z } from 'zod'

const updateQuoteStatusSchema = z.object({
  status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'expired', 'rejected']),
  acceptedAt: z.string().datetime().optional(),
  rejectedAt: z.string().datetime().optional(),
  rejectionReason: z.string().optional(),
})

// GET /api/quotes/[id] - Get quote
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const quote = await QuoteGeneratorService.getQuote(tenantId, params.id)

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: quote,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get quote error:', error)
    return NextResponse.json(
      { error: 'Failed to get quote' },
      { status: 500 }
    )
  }
}

// PUT /api/quotes/[id] - Update quote status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateQuoteStatusSchema.parse(body)

    const quote = await QuoteGeneratorService.updateQuoteStatus(
      tenantId,
      params.id,
      validated.status,
      {
        acceptedAt: validated.acceptedAt ? new Date(validated.acceptedAt) : undefined,
        rejectedAt: validated.rejectedAt ? new Date(validated.rejectedAt) : undefined,
        rejectionReason: validated.rejectionReason,
      }
    )

    return NextResponse.json({
      success: true,
      data: quote,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Update quote error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE /api/quotes/[id] - Delete quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    await QuoteGeneratorService.deleteQuote(tenantId, params.id)

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete quote error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete quote' },
      { status: 500 }
    )
  }
}
