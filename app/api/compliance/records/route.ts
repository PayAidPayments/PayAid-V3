import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createComplianceSchema = z.object({
  complianceType: z.enum(['GDPR', 'DATA_PRIVACY', 'LEGAL', 'AUDIT']),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  assignedTo: z.string().optional(),
  documents: z.array(z.string()).default([]),
  notes: z.string().optional(),
})

/**
 * GET /api/compliance/records
 * List compliance records
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'compliance')

    const { searchParams } = new URL(request.url)
    const complianceType = searchParams.get('complianceType')
    const status = searchParams.get('status')
    const assignedTo = searchParams.get('assignedTo')

    const where: any = { tenantId }
    if (complianceType) where.complianceType = complianceType
    if (status) where.status = status
    if (assignedTo) where.assignedTo = assignedTo

    const records = await prisma.complianceRecord.findMany({
      where,
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json({ records })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get compliance records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch compliance records' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/compliance/records
 * Create compliance record
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'compliance')

    const body = await request.json()
    const validated = createComplianceSchema.parse(body)

    const record = await prisma.complianceRecord.create({
      data: {
        tenantId,
        complianceType: validated.complianceType,
        title: validated.title,
        description: validated.description,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        assignedTo: validated.assignedTo,
        documents: validated.documents,
        notes: validated.notes,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ record }, { status: 201 })
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

    console.error('Create compliance record error:', error)
    return NextResponse.json(
      { error: 'Failed to create compliance record' },
      { status: 500 }
    )
  }
}

