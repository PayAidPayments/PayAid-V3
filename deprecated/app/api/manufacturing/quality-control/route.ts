import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createQualityControlSchema = z.object({
  orderId: z.string().optional(),
  inspectionType: z.enum(['INCOMING', 'IN_PROCESS', 'FINAL']),
  inspectorName: z.string().min(1),
  inspectionDate: z.string().datetime(),
  passed: z.boolean(),
  defects: z.array(z.any()).optional(),
  notes: z.string().optional(),
})

/**
 * GET /api/manufacturing/quality-control
 * List quality control records
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'manufacturing')

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const inspectionType = searchParams.get('inspectionType')
    const passed = searchParams.get('passed')

    const where: any = { tenantId }
    if (orderId) where.orderId = orderId
    if (inspectionType) where.inspectionType = inspectionType
    if (passed !== null) where.passed = passed === 'true'

    const records = await prisma.manufacturingQualityControl.findMany({
      where,
      orderBy: { inspectionDate: 'desc' },
    })

    return NextResponse.json({ records })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get quality control records error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quality control records' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/manufacturing/quality-control
 * Create quality control record
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'manufacturing')

    const body = await request.json()
    const validated = createQualityControlSchema.parse(body)

    // Verify order if provided
    if (validated.orderId) {
      const order = await prisma.manufacturingOrder.findFirst({
        where: {
          id: validated.orderId,
          tenantId,
        },
      })

      if (!order) {
        return NextResponse.json(
          { error: 'Manufacturing order not found' },
          { status: 404 }
        )
      }
    }

    const record = await prisma.manufacturingQualityControl.create({
      data: {
        tenantId,
        orderId: validated.orderId,
        inspectionType: validated.inspectionType,
        inspectorName: validated.inspectorName,
        inspectionDate: new Date(validated.inspectionDate),
        passed: validated.passed,
        defects: validated.defects,
        notes: validated.notes,
      },
    })

    // Update order quality status if orderId provided
    if (validated.orderId) {
      await prisma.manufacturingOrder.update({
        where: { id: validated.orderId },
        data: {
          qualityStatus: validated.passed ? 'PASSED' : 'FAILED',
        },
      })
    }

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

    console.error('Create quality control record error:', error)
    return NextResponse.json(
      { error: 'Failed to create quality control record' },
      { status: 500 }
    )
  }
}

