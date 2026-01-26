import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { InternalSignatureService } from '@/lib/signatures/internal-signature'
import { z } from 'zod'

const requestSignatureSchema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
  signerRole: z.enum(['PARTY', 'US', 'WITNESS']).default('PARTY'),
  message: z.string().optional(),
})

/**
 * POST /api/quotes/[id]/request-signature
 * Request signature for a quote (internal signature system)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const quoteId = params.id

    const body = await request.json()
    const validated = requestSignatureSchema.parse(body)

    const result = await InternalSignatureService.requestQuoteSignature(tenantId, quoteId, {
      signerName: validated.signerName,
      signerEmail: validated.signerEmail,
      signerRole: validated.signerRole,
      message: validated.message,
    })

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Signature request sent successfully',
    })
  } catch (error) {
    console.error('[Quote Signature Request] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}
