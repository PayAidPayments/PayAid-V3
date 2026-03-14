/**
 * Quotes API Route
 * POST /api/quotes - Generate quote from deal
 * GET /api/quotes - List quotes
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { QuoteGeneratorService } from '@/lib/quotes/quote-generator'
import { z } from 'zod'

const generateQuoteSchema = z.object({
  dealId: z.string(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      productName: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      discount: z.number().min(0).optional(),
    })
  ),
  taxRate: z.number().min(0).max(100).optional(),
  discount: z.number().min(0).optional(),
  validUntil: z.string().datetime().optional(),
})

// POST /api/quotes - Generate quote
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = generateQuoteSchema.parse(body)

    const quote = await QuoteGeneratorService.generateQuoteFromDeal(
      tenantId,
      validated.dealId,
      validated.lineItems,
      {
        taxRate: validated.taxRate,
        discount: validated.discount,
        validUntil: validated.validUntil ? new Date(validated.validUntil) : undefined,
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

    console.error('Generate quote error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate quote' },
      { status: 500 }
    )
  }
}

// GET /api/quotes - List quotes
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { searchParams } = new URL(request.url)

    const dealId = searchParams.get('dealId') || undefined
    const contactId = searchParams.get('contactId') || undefined
    const status = searchParams.get('status') || undefined

    const quotes = await QuoteGeneratorService.listQuotes(tenantId, {
      dealId,
      contactId,
      status,
    })

    return NextResponse.json({
      success: true,
      data: quotes,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('List quotes error:', error)
    return NextResponse.json(
      { error: 'Failed to list quotes' },
      { status: 500 }
    )
  }
}
