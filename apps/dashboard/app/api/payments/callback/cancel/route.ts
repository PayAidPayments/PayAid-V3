import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/payments/callback/cancel
 * Customer return URL after cancelled payment
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const invoiceId = searchParams.get('invoice_id')
    const orderId = searchParams.get('order_id')

    if (invoiceId) {
      // Update invoice payment status
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          paymentStatus: 'cancelled',
        },
      })
    }

    const cancelUrl = new URL('/payment-cancelled', request.url)
    if (invoiceId) cancelUrl.searchParams.set('invoice_id', invoiceId)
    if (orderId) cancelUrl.searchParams.set('order_id', orderId)

    return NextResponse.redirect(cancelUrl)
  } catch (error) {
    console.error('Payment cancel callback error:', error)
    return NextResponse.redirect(new URL('/payment-cancelled', request.url))
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests from PayAid Payments
  return GET(request)
}
