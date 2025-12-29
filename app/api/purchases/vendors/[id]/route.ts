import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateVendorSchema = z.object({
  name: z.string().min(1).optional(),
  companyName: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  paymentTerms: z.string().optional().nullable(),
  creditLimit: z.number().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLACKLISTED']).optional(),
  notes: z.string().optional().nullable(),
})

// GET /api/purchases/vendors/[id] - Get a single vendor
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        purchaseOrders: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            id: true,
            poNumber: true,
            status: true,
            total: true,
            orderDate: true,
          },
        },
        ratings: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
          include: {
            ratedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
            ratings: true,
          },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Calculate average rating
    const avgRating = vendor.ratings.length > 0
      ? vendor.ratings.reduce((sum, r) => sum + Number(r.rating), 0) / vendor.ratings.length
      : null

    return NextResponse.json({
      vendor: {
        ...vendor,
        averageRating: avgRating,
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get vendor error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    )
  }
}

// PATCH /api/purchases/vendors/[id] - Update a vendor
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        tenantId,
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = updateVendorSchema.parse(body)

    const updateData: any = {}

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.companyName !== undefined) updateData.companyName = validated.companyName
    if (validated.email !== undefined) updateData.email = validated.email
    if (validated.phone !== undefined) updateData.phone = validated.phone
    if (validated.address !== undefined) updateData.address = validated.address
    if (validated.city !== undefined) updateData.city = validated.city
    if (validated.state !== undefined) updateData.state = validated.state
    if (validated.postalCode !== undefined) updateData.postalCode = validated.postalCode
    if (validated.country !== undefined) updateData.country = validated.country
    if (validated.gstin !== undefined) updateData.gstin = validated.gstin
    if (validated.pan !== undefined) updateData.pan = validated.pan
    if (validated.paymentTerms !== undefined) updateData.paymentTerms = validated.paymentTerms
    if (validated.creditLimit !== undefined) updateData.creditLimit = validated.creditLimit
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.notes !== undefined) updateData.notes = validated.notes

    const updated = await prisma.vendor.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            purchaseOrders: true,
            ratings: true,
          },
        },
      },
    })

    return NextResponse.json({ vendor: updated })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    console.error('Update vendor error:', error)
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    )
  }
}

// DELETE /api/purchases/vendors/[id] - Delete a vendor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { tenantId } = await requireModuleAccess(request, 'finance')

    const vendor = await prisma.vendor.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    // Prevent deletion if vendor has purchase orders
    if (vendor._count.purchaseOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete vendor with purchase orders. Set status to INACTIVE instead.' },
        { status: 400 }
      )
    }

    await prisma.vendor.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Vendor deleted successfully' })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Delete vendor error:', error)
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    )
  }
}

