import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { InternalSignatureService } from '@/lib/signatures/internal-signature'
import { z } from 'zod'

const signQuoteSchema = z.object({
  signatureData: z.string(), // Base64 signature image
  signerEmail: z.string().email(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

/**
 * POST /api/quotes/[id]/sign
 * Sign a quote (internal signature system)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const quoteId = params.id

    const body = await request.json()
    const validated = signQuoteSchema.parse(body)

    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await InternalSignatureService.signQuote(tenantId, quoteId, {
      signatureId: quoteId,
      signatureUrl: `data:image/png;base64,${validated.signatureData}`,
      signerEmail: validated.signerEmail,
      ipAddress: validated.ipAddress || clientIp,
      userAgent: validated.userAgent || userAgent,
    })

    return NextResponse.json({
      success: true,
      message: 'Quote signed successfully',
    })
  } catch (error) {
    console.error('[Quote Sign] Error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    return handleLicenseError(error)
  }
}
