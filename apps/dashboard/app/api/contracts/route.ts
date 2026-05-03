import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'

const createContractSchema = z.object({
  contractNumber: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  contractType: z.enum(['SERVICE', 'SALES', 'PURCHASE', 'EMPLOYMENT', 'NDA', 'OTHER']),
  partyName: z.string().min(1),
  partyEmail: z.string().email().optional(),
  partyPhone: z.string().optional(),
  partyAddress: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  value: z.number().positive().optional(),
  currency: z.string().default('INR'),
  templateId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

// GET /api/contracts - List contracts
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const contractType = searchParams.get('contractType')
    const search = searchParams.get('search')

    const where: any = { tenantId }
    if (status) where.status = status
    if (contractType) where.contractType = contractType
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contractNumber: { contains: search, mode: 'insensitive' } },
        { partyName: { contains: search, mode: 'insensitive' } },
      ]
    }

    const contracts = await prisma.contract.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        signatures: {
          select: {
            id: true,
            signerName: true,
            signerRole: true,
            signedAt: true,
          },
        },
        _count: {
          select: {
            versions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ contracts })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get contracts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create contract
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createContractSchema.parse(body)

    // Generate contract number if not provided
    let contractNumber = validated.contractNumber
    if (!contractNumber) {
      const count = await prisma.contract.count({ where: { tenantId } })
      contractNumber = `CNT-${tenantId.substring(0, 8).toUpperCase()}-${String(count + 1).padStart(6, '0')}`
    }

    // Check uniqueness
    const existing = await prisma.contract.findUnique({
      where: {
        tenantId_contractNumber: {
          tenantId,
          contractNumber,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Contract number already exists' },
        { status: 400 }
      )
    }

    const contract = await prisma.contract.create({
      data: {
        tenantId,
        contractNumber,
        title: validated.title,
        description: validated.description,
        contractType: validated.contractType,
        partyName: validated.partyName,
        partyEmail: validated.partyEmail,
        partyPhone: validated.partyPhone,
        partyAddress: validated.partyAddress,
        startDate: validated.startDate ? new Date(validated.startDate) : null,
        endDate: validated.endDate ? new Date(validated.endDate) : null,
        value: validated.value ? new Decimal(validated.value) : null,
        currency: validated.currency,
        templateId: validated.templateId,
        tags: validated.tags || [],
        notes: validated.notes,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ contract }, { status: 201 })
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

    console.error('Create contract error:', error)
    return NextResponse.json(
      { error: 'Failed to create contract' },
      { status: 500 }
    )
  }
}

