import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const updateContractSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  contractType: z.enum(['SERVICE', 'SALES', 'PURCHASE', 'EMPLOYMENT', 'NDA', 'OTHER']).optional(),
  partyName: z.string().min(1).optional(),
  partyEmail: z.string().email().optional(),
  partyPhone: z.string().optional(),
  partyAddress: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  value: z.number().positive().optional(),
  currency: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  status: z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'EXPIRED', 'TERMINATED']).optional(),
})

// GET /api/contracts/[id] - Get contract
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const contract = await prisma.contract.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        signatures: {
          orderBy: { signedAt: 'desc' },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ contract })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get contract error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contract' },
      { status: 500 }
    )
  }
}

// PATCH /api/contracts/[id] - Update contract
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = updateContractSchema.parse(body)

    const contract = await prisma.contract.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.description !== undefined) updateData.description = validated.description
    if (validated.contractType !== undefined) updateData.contractType = validated.contractType
    if (validated.partyName !== undefined) updateData.partyName = validated.partyName
    if (validated.partyEmail !== undefined) updateData.partyEmail = validated.partyEmail
    if (validated.partyPhone !== undefined) updateData.partyPhone = validated.partyPhone
    if (validated.partyAddress !== undefined) updateData.partyAddress = validated.partyAddress
    if (validated.startDate !== undefined) updateData.startDate = new Date(validated.startDate)
    if (validated.endDate !== undefined) updateData.endDate = new Date(validated.endDate)
    if (validated.value !== undefined) updateData.value = new Decimal(validated.value)
    if (validated.currency !== undefined) updateData.currency = validated.currency
    if (validated.tags !== undefined) updateData.tags = validated.tags
    if (validated.notes !== undefined) updateData.notes = validated.notes
    if (validated.status !== undefined) updateData.status = validated.status

    const updated = await prisma.contract.update({
      where: { id: params.id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        signatures: {
          orderBy: { signedAt: 'desc' },
        },
      },
    })

    return NextResponse.json({ contract: updated })
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

    console.error('Update contract error:', error)
    return NextResponse.json(
      { error: 'Failed to update contract' },
      { status: 500 }
    )
  }
}

