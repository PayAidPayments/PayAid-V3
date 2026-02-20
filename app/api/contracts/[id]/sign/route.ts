import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { InternalSignatureService } from '@/lib/signatures/internal-signature'
import { z } from 'zod'

const signContractSchema = z.object({
  signatureId: z.string().optional(), // If signing on behalf of someone
  signatureData: z.string().optional(), // Base64 signature image or data
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

/**
 * POST /api/contracts/[id]/sign
 * Sign a contract (using internal signature system)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const contractId = typeof params?.id === 'string' ? params.id : undefined
    if (!contractId) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const validated = signContractSchema.parse(body)

    if (!validated.signatureId) {
      return NextResponse.json(
        { error: 'signatureId is required' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     validated.ipAddress || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 
                     validated.userAgent || 
                     'unknown'

    // Use internal signature service
    const result = await InternalSignatureService.signContract(
      tenantId,
      contractId,
      {
        signatureId: validated.signatureId,
        signatureUrl: validated.signatureData
          ? `data:image/png;base64,${validated.signatureData}`
          : '',
        ipAddress: clientIp,
        userAgent: userAgent,
      }
    )

    return NextResponse.json({
      message: 'Contract signed successfully',
      allSignaturesCollected: result.allSignaturesCollected,
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

    console.error('Sign contract error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sign contract' },
      { status: 500 }
    )
  }
}
