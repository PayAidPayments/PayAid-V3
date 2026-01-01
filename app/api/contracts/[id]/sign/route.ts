import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const signContractSchema = z.object({
  signerName: z.string().min(1),
  signerEmail: z.string().email(),
  signerRole: z.enum(['PARTY', 'US', 'WITNESS']),
  signatureMethod: z.enum(['MANUAL', 'DOCUSIGN', 'HELLOSIGN', 'E_MUDRA']).default('MANUAL'),
  signatureUrl: z.string().optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
})

// POST /api/contracts/[id]/sign - Add signature to contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const contract = await prisma.contract.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = signContractSchema.parse(body)

    // Create signature record
    const signature = await prisma.contractSignature.create({
      data: {
        contractId: id,
        signerName: validated.signerName,
        signerEmail: validated.signerEmail,
        signerRole: validated.signerRole,
        signatureMethod: validated.signatureMethod,
        signatureUrl: validated.signatureUrl,
        signedAt: new Date(),
        ipAddress: validated.ipAddress,
        userAgent: validated.userAgent,
      },
    })

    // Update contract status based on signatures
    const allSignatures = await prisma.contractSignature.findMany({
      where: { contractId: id },
    })

    const hasPartySignature = allSignatures.some((s) => s.signerRole === 'PARTY')
    const hasUsSignature = allSignatures.some((s) => s.signerRole === 'US')

    let newStatus = contract.status
    if (hasPartySignature && hasUsSignature) {
      newStatus = 'ACTIVE'
    } else if (hasPartySignature || hasUsSignature) {
      newStatus = 'PENDING_SIGNATURE'
    }

    await prisma.contract.update({
      where: { id },
      data: {
        status: newStatus,
        signedByParty: hasPartySignature,
        signedByUs: hasUsSignature,
        signedAt: newStatus === 'ACTIVE' ? new Date() : contract.signedAt,
      },
    })

    return NextResponse.json({ signature })
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

