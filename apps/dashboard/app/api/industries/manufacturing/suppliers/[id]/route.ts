import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
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
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED']).optional(),
  rating: z.number().min(0).max(5).optional(),
  onTimeDelivery: z.number().min(0).max(100).optional(),
  qualityScore: z.number().min(0).max(100).optional(),
})

// GET /api/industries/manufacturing/suppliers/[id] - Get supplier details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

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

    const supplier = await prisma.supplier.findUnique({
      where: {
        id,
        tenantId,
      },
      include: {
        materials: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            vendor: true,
          },
        },
        _count: {
          select: {
            materials: true,
            purchaseOrders: true,
          },
        },
      },
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ supplier })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get supplier error:', error)
    return NextResponse.json(
      { error: 'Failed to get supplier' },
      { status: 500 }
    )
  }
}

// PUT /api/industries/manufacturing/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

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
    const validated = updateSupplierSchema.parse(body)

    const supplier = await prisma.supplier.update({
      where: {
        id,
        tenantId,
      },
      data: validated,
    })

    return NextResponse.json({ supplier })
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

    console.error('Update supplier error:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE /api/industries/manufacturing/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

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

    await prisma.supplier.delete({
      where: {
        id,
        tenantId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete supplier error:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}

