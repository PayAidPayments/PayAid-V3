import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * POST /api/invoices/[id]/track-payment-link
 * Track when payment link is opened (called from frontend when link is accessed)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Update tracking
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentLinkOpenedCount: {
          increment: 1,
        },
        paymentLinkOpenedAt: invoice.paymentLinkOpenedAt ? invoice.paymentLinkOpenedAt : new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Track payment link error:', error)
    return NextResponse.json(
      { error: 'Failed to track payment link' },
      { status: 500 }
    )
  }
}
