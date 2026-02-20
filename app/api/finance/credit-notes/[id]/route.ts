import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

// GET /api/finance/credit-notes/[id] - Get single credit note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireModuleAccess(request, 'finance')

    const { id } = await params
    const creditNote = await prisma.creditNote.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            gstin: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
      },
    })

    if (!creditNote) {
      return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
    }

    return NextResponse.json({ creditNote })
  } catch (error: any) {
    console.error('[GET /api/finance/credit-notes/[id]]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch credit note' },
      { status: 500 }
    )
  }
}

// PATCH /api/finance/credit-notes/[id] - Update credit note
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireModuleAccess(request, 'finance')

    const { id } = await params
    const body = await request.json()
    const { status, ...updateData } = body

    // If updating status to 'issued', ensure all required fields are present
    if (status === 'issued') {
      const existing = await prisma.creditNote.findUnique({
        where: { id },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Credit note not found' }, { status: 404 })
      }
      if (!existing.customerId && !existing.customerName) {
        return NextResponse.json(
          { error: 'Customer information is required to issue credit note' },
          { status: 400 }
        )
      }
    }

    const creditNote = await prisma.creditNote.update({
      where: { id },
      data: {
        ...updateData,
        ...(status && { status }),
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json({ creditNote })
  } catch (error: any) {
    console.error('[PATCH /api/finance/credit-notes/[id]]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update credit note' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/credit-notes/[id] - Cancel credit note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireModuleAccess(request, 'finance')

    const { id } = await params
    const creditNote = await prisma.creditNote.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ creditNote })
  } catch (error: any) {
    console.error('[DELETE /api/finance/credit-notes/[id]]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel credit note' },
      { status: 500 }
    )
  }
}
