import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const requestSignatureSchema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
  signerRole: z.enum(['PARTY', 'US', 'WITNESS']),
  signatureMethod: z.enum(['MANUAL', 'DOCUSIGN', 'HELLOSIGN', 'E_MUDRA']).default('MANUAL'),
  message: z.string().optional(),
})

/**
 * POST /api/contracts/[id]/request-signature
 * Request e-signature for a contract
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const contractId = params.id

    const body = await request.json()
    const validated = requestSignatureSchema.parse(body)

    // Get contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
    })

    if (!contract || contract.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Check if signature already exists for this email
    const existingSignature = await prisma.contractSignature.findFirst({
      where: {
        contractId,
        signerEmail: validated.signerEmail,
      },
    })

    if (existingSignature && existingSignature.signedAt) {
      return NextResponse.json(
        { error: 'This signer has already signed the contract' },
        { status: 400 }
      )
    }

    // Create or update signature request
    let signature = existingSignature
    if (!signature) {
      signature = await prisma.contractSignature.create({
        data: {
          contractId,
          signerName: validated.signerName,
          signerEmail: validated.signerEmail,
          signerRole: validated.signerRole,
          signatureMethod: validated.signatureMethod,
        },
      })
    } else {
      signature = await prisma.contractSignature.update({
        where: { id: signature.id },
        data: {
          signerName: validated.signerName,
          signerRole: validated.signerRole,
          signatureMethod: validated.signatureMethod,
        },
      })
    }

    // TODO: Send email with signature link
    // For now, return the signature URL (which would be generated)
    const signatureUrl = `${process.env.NEXT_PUBLIC_APP_URL}/contracts/sign/${signature.id}`

    // Update contract status if needed
    if (contract.status === 'DRAFT') {
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'PENDING_SIGNATURE' },
      })
    }

    return NextResponse.json({
      signature,
      signatureUrl,
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
      { error: 'Failed to request signature' },
      { status: 500 }
    )
  }
}

