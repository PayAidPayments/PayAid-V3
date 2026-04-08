import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createDocSchema = z.object({
  documentType: z.string().min(1),
  fileUrl: z.string().url(),
  status: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional().default('PENDING'),
  expiryDate: z.string().datetime().optional().nullable(),
})

/**
 * GET /api/hr/employees/[id]/documents - List documents for an employee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'hr')
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true },
    })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const docs = await prisma.employeeDocument.findMany({
      where: { employeeId, tenantId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      documents: docs.map((d) => ({
        id: d.id,
        documentType: d.documentType,
        fileUrl: d.fileUrl,
        status: d.status ?? 'PENDING',
        expiryDate: d.expiryDate?.toISOString() ?? null,
        createdAt: d.createdAt.toISOString(),
      })),
    })
  } catch (e) {
    if (e && typeof e === 'object' && 'moduleId' in e) return handleLicenseError(e)
    console.error('GET employee documents:', e)
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 })
  }
}

/**
 * POST /api/hr/employees/[id]/documents - Add a document (offer letter, PAN, Aadhaar, bank proof)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'hr')
    const { id: employeeId } = await params

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, tenantId },
      select: { id: true },
    })
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const body = await request.json()
    const parsed = createDocSchema.parse(body)

    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId,
        tenantId,
        documentType: parsed.documentType,
        fileUrl: parsed.fileUrl,
        status: parsed.status,
        expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null,
        generatedBy: userId ?? 'system',
      },
    })

    return NextResponse.json({
      document: {
        id: doc.id,
        documentType: doc.documentType,
        fileUrl: doc.fileUrl,
        status: doc.status ?? 'PENDING',
        expiryDate: doc.expiryDate?.toISOString() ?? null,
        createdAt: doc.createdAt.toISOString(),
      },
    }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    if (e && typeof e === 'object' && 'moduleId' in e) return handleLicenseError(e)
    console.error('POST employee documents:', e)
    return NextResponse.json({ error: 'Failed to add document' }, { status: 500 })
  }
}
