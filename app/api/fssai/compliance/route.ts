import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createComplianceSchema = z.object({
  licenseId: z.string(),
  complianceType: z.enum(['INSPECTION', 'RENEWAL', 'DOCUMENT_UPDATE', 'VIOLATION']),
  complianceDate: z.string().datetime(),
  description: z.string().min(1),
  dueDate: z.string().datetime().optional(),
  documents: z.array(z.string()).optional(),
  notes: z.string().optional(),
})

// GET /api/fssai/compliance - List FSSAI compliance records
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const licenseId = searchParams.get('licenseId')
    const status = searchParams.get('status')
    const complianceType = searchParams.get('complianceType')

    const where: any = { tenantId }
    if (licenseId) where.licenseId = licenseId
    if (status) where.status = status
    if (complianceType) where.complianceType = complianceType

    const compliances = await prisma.fSSAICompliance.findMany({
      where,
      include: {
        license: {
          select: {
            id: true,
            licenseNumber: true,
            businessName: true,
          },
        },
      },
      orderBy: { complianceDate: 'desc' },
    })

    return NextResponse.json({ compliances })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get FSSAI compliance error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch FSSAI compliance records' },
      { status: 500 }
    )
  }
}

// POST /api/fssai/compliance - Create FSSAI compliance record
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createComplianceSchema.parse(body)

    const compliance = await prisma.fSSAICompliance.create({
      data: {
        tenantId,
        licenseId: validated.licenseId,
        complianceType: validated.complianceType,
        complianceDate: new Date(validated.complianceDate),
        description: validated.description,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        documents: validated.documents || [],
        notes: validated.notes,
      },
      include: {
        license: true,
      },
    })

    return NextResponse.json({ compliance }, { status: 201 })
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

    console.error('Create FSSAI compliance error:', error)
    return NextResponse.json(
      { error: 'Failed to create FSSAI compliance record' },
      { status: 500 }
    )
  }
}

