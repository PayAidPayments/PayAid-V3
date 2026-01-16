import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const signContractSchema = z.object({
  signatureId: z.string().optional(), // If signing on behalf of someone
  signatureData: z.string().optional(), // Base64 signature image or data
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

/**
 * POST /api/contracts/[id]/sign
 * Sign a contract (e-signature)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const contractId = params.id

    const body = await request.json()
    const validated = signContractSchema.parse(body)

    // Get contract
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        signatures: true,
      },
    })

    if (!contract || contract.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Find or create signature
    let signature = validated.signatureId
      ? await prisma.contractSignature.findUnique({
          where: { id: validated.signatureId },
        })
      : await prisma.contractSignature.findFirst({
          where: {
            contractId,
            signerEmail: user.email,
          },
        })

    if (!signature) {
      // Create new signature for current user
      signature = await prisma.contractSignature.create({
        data: {
          contractId,
          signerName: user.name || user.email,
          signerEmail: user.email,
          signerRole: 'US',
          signatureMethod: 'MANUAL',
        },
      })
    }

    if (signature.signedAt) {
      return NextResponse.json(
        { error: 'Contract already signed by this signer' },
        { status: 400 }
      )
    }

    // Update signature
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    await prisma.contractSignature.update({
      where: { id: signature.id },
      data: {
        signedAt: new Date(),
        ipAddress: validated.ipAddress || clientIp,
        userAgent: validated.userAgent || userAgent,
        signatureUrl: validated.signatureData ? `data:image/png;base64,${validated.signatureData}` : null,
      },
    })

    // Check if all required signatures are collected
    const allSignatures = await prisma.contractSignature.findMany({
      where: { contractId },
    })

    const allSigned = allSignatures.every((sig) => sig.signedAt !== null)

    if (allSigned && contract.status === 'PENDING_SIGNATURE') {
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: 'SIGNED' },
      })
    }

    return NextResponse.json({
      message: 'Contract signed successfully',
      allSignaturesCollected: allSigned,
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
      { error: 'Failed to sign contract' },
      { status: 500 }
    )
  }
}
