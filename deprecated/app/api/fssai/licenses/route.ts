import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createLicenseSchema = z.object({
  licenseNumber: z.string().min(1),
  licenseType: z.enum(['BASIC', 'STATE', 'CENTRAL']),
  businessName: z.string().min(1),
  businessAddress: z.string().min(1),
  issueDate: z.string().datetime(),
  expiryDate: z.string().datetime(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

// GET /api/fssai/licenses - List FSSAI licenses
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    const where: any = { tenantId }
    if (status) where.status = status

    const licenses = await prisma.fSSAILicense.findMany({
      where,
      include: {
        _count: {
          select: {
            compliances: true,
          },
        },
      },
      orderBy: { expiryDate: 'asc' },
    })

    return NextResponse.json({ licenses })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get FSSAI licenses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FSSAI licenses' },
      { status: 500 }
    )
  }
}

// POST /api/fssai/licenses - Create FSSAI license
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createLicenseSchema.parse(body)

    // Check if license number already exists
    const existing = await prisma.fSSAILicense.findUnique({
      where: {
        tenantId_licenseNumber: {
          tenantId,
          licenseNumber: validated.licenseNumber,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'License number already exists' },
        { status: 400 }
      )
    }

    const license = await prisma.fSSAILicense.create({
      data: {
        tenantId,
        licenseNumber: validated.licenseNumber,
        licenseType: validated.licenseType,
        businessName: validated.businessName,
        businessAddress: validated.businessAddress,
        issueDate: new Date(validated.issueDate),
        expiryDate: new Date(validated.expiryDate),
        documents: validated.documents || [],
        notes: validated.notes,
      },
    })

    return NextResponse.json({ license }, { status: 201 })
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

    console.error('Create FSSAI license error:', error)
    return NextResponse.json(
      { error: 'Failed to create FSSAI license' },
      { status: 500 }
    )
  }
}

