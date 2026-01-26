import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { InternalSignatureService } from '@/lib/signatures/internal-signature'
import { z } from 'zod'

const requestSignatureSchema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
  signerRole: z.enum(['PARTY', 'US', 'WITNESS']),
  message: z.string().optional(),
})

/**
 * POST /api/contracts/[id]/request-signature
 * Request e-signature for a contract (using internal signature system)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const contractId = params.id

    const body = await request.json()
    const validated = requestSignatureSchema.parse(body)

    // Use internal signature service
    const result = await InternalSignatureService.requestContractSignature(
      tenantId,
      contractId,
      {
        signerName: validated.signerName,
        signerEmail: validated.signerEmail,
        signerRole: validated.signerRole,
        message: validated.message,
      }
    )

    return NextResponse.json({
      signatureId: result.signatureId,
      signatureUrl: result.signatureUrl,
      message: 'Signature request sent successfully',
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Request signature error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to request signature' },
      { status: 500 }
    )
  }
}
