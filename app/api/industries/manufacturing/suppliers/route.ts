import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createSupplierSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  contactName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  gstin: z.string().optional(),
  pan: z.string().optional(),
  paymentTerms: z.string().optional(),
  creditLimit: z.number().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED']).default('ACTIVE'),
})

// GET /api/industries/manufacturing/suppliers - List suppliers
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'manufacturing') {
      return NextResponse.json(
        { error: 'This endpoint is only for manufacturing industry' },
        { status: 403 }
      )
    }

    const status = request.nextUrl.searchParams.get('status')
    const where: any = { tenantId }
    if (status) {
      where.status = status
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            materials: true,
            purchaseOrders: true,
          },
        },
      },
    })

    return NextResponse.json({ suppliers })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get suppliers error:', error)
    return NextResponse.json(
      { error: 'Failed to get suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/industries/manufacturing/suppliers - Create supplier
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    if (tenant?.industry !== 'manufacturing') {
      return NextResponse.json(
        { error: 'This endpoint is only for manufacturing industry' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validated = createSupplierSchema.parse(body)

    // Check if code is unique (if provided)
    if (validated.code) {
      const existing = await prisma.supplier.findUnique({
        where: {
          tenantId_code: {
            tenantId,
            code: validated.code,
          },
        },
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Supplier code already exists' },
          { status: 400 }
        )
      }
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: validated.name,
        code: validated.code,
        contactName: validated.contactName,
        email: validated.email,
        phone: validated.phone,
        address: validated.address,
        city: validated.city,
        state: validated.state,
        pincode: validated.pincode,
        gstin: validated.gstin,
        pan: validated.pan,
        paymentTerms: validated.paymentTerms,
        creditLimit: validated.creditLimit,
        status: validated.status,
      },
    })

    return NextResponse.json({ supplier }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create supplier error:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}

