import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/payments/callback/failure
 * Customer return URL after failed payment
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
          paymentStatus: 'failed',
        },
      })
    }

    const errorUrl = new URL('/payment-error', request.url)
    if (invoiceId) errorUrl.searchParams.set('invoice_id', invoiceId)
    if (orderId) errorUrl.searchParams.set('order_id', orderId)

    return NextResponse.redirect(errorUrl)
  } catch (error) {
    console.error('Payment failure callback error:', error)
    return NextResponse.redirect(new URL('/payment-error', request.url))
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests from PayAid Payments
  return GET(request)
}
