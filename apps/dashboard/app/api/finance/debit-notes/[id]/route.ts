import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess } from '@/lib/middleware/auth'

// GET /api/finance/debit-notes/[id] - Get single debit note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireModuleAccess(request, 'finance')

    const { id } = await params
    const debitNote = await prisma.debitNote.findUnique({
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

    if (!debitNote) {
      return NextResponse.json({ error: 'Debit note not found' }, { status: 404 })
    }

    return NextResponse.json({ debitNote })
  } catch (error: any) {
    console.error('[GET /api/finance/debit-notes/[id]]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch debit note' },
      { status: 500 }
    )
  }
}

// PATCH /api/finance/debit-notes/[id] - Update debit note
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
      const existing = await prisma.debitNote.findUnique({
        where: { id },
      })
      if (!existing) {
        return NextResponse.json({ error: 'Debit note not found' }, { status: 404 })
      }
      if (!existing.customerId && !existing.customerName) {
        return NextResponse.json(
          { error: 'Customer information is required to issue debit note' },
          { status: 400 }
        )
      }
    }

    const debitNote = await prisma.debitNote.update({
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

    return NextResponse.json({ debitNote })
  } catch (error: any) {
    console.error('[PATCH /api/finance/debit-notes/[id]]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update debit note' },
      { status: 500 }
    )
  }
}

// DELETE /api/finance/debit-notes/[id] - Cancel debit note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireModuleAccess(request, 'finance')

    const { id } = await params
    const debitNote = await prisma.debitNote.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    return NextResponse.json({ debitNote })
  } catch (error: any) {
    console.error('[DELETE /api/finance/debit-notes/[id]]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to cancel debit note' },
      { status: 500 }
    )
  }
}
