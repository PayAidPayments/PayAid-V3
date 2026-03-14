import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { getPayAidPayments } from '@/lib/payments/payaid'

/**
 * GET /api/payments/callback/success
 * Customer return URL after successful payment
 * This is where customers are redirected after payment
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const invoiceId = searchParams.get('invoice_id')
    
    // Get payment response from query params (PayAid Payments posts data here)
    // In production, this would be a POST request, but we handle both
    const paymentData: any = {}
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'invoice_id') {
        paymentData[key] = value
      }
    }

    if (!invoiceId && !paymentData.order_id) {
      return NextResponse.redirect(new URL('/payment-error', request.url))
    }

    // Find invoice
    const invoice = await prisma.invoice.findFirst({
      where: invoiceId 
        ? { id: invoiceId }
        : { invoiceNumber: paymentData.order_id },
    })

    if (!invoice) {
      return NextResponse.redirect(new URL('/payment-error', request.url))
    }

    // Verify hash if present
    if (paymentData.hash) {
      const payaidPayments = getPayAidPayments()
      if (!payaidPayments.verifyWebhookSignature(paymentData)) {
        console.error('Invalid payment response hash')
        return NextResponse.redirect(new URL('/payment-error?reason=invalid_hash', request.url))
      }
    }

    // Update invoice if payment was successful
    if (paymentData.response_code === '0' || paymentData.response_code === 0) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentTransactionId: paymentData.transaction_id,
          paymentStatus: 'paid',
          paymentMode: paymentData.payment_mode,
          paymentChannel: paymentData.payment_channel,
          paymentDatetime: paymentData.payment_datetime ? new Date(paymentData.payment_datetime) : new Date(),
          status: 'paid',
          paidAt: new Date(),
        },
      })
    }

    // Redirect to success page
    const successUrl = new URL('/payment-success', request.url)
    successUrl.searchParams.set('invoice_id', invoice.id)
    successUrl.searchParams.set('invoice_number', invoice.invoiceNumber)
    if (paymentData.transaction_id) {
      successUrl.searchParams.set('transaction_id', paymentData.transaction_id)
    }

    return NextResponse.redirect(successUrl)
  } catch (error: any) {
    console.error('Payment success callback error:', error)
    return NextResponse.redirect(new URL('/payment-error', request.url))
  }
}

// Handle POST requests (PayAid Payments may POST data)
export async function POST(request: NextRequest) {
  try {
    const body = await request.formData()
    const invoiceId = body.get('invoice_id') as string || body.get('udf1') as string
    
    // Convert FormData to object
    const paymentData: any = {}
    for (const [key, value] of body.entries()) {
      if (key !== 'invoice_id') {
        paymentData[key] = value.toString()
      }
    }

    if (!invoiceId && !paymentData.order_id) {
      return NextResponse.redirect(new URL('/payment-error', request.url))
    }

    // Find and update invoice (same logic as GET)
    const invoice = await prisma.invoice.findFirst({
      where: invoiceId 
        ? { id: invoiceId }
        : { invoiceNumber: paymentData.order_id },
    })

    if (!invoice) {
      return NextResponse.redirect(new URL('/payment-error', request.url))
    }

    // Verify hash
    if (paymentData.hash) {
      const payaidPayments = getPayAidPayments()
      if (!payaidPayments.verifyWebhookSignature(paymentData)) {
        return NextResponse.redirect(new URL('/payment-error?reason=invalid_hash', request.url))
      }
    }

    // Update invoice
    if (paymentData.response_code === '0' || paymentData.response_code === 0) {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentTransactionId: paymentData.transaction_id,
          paymentStatus: 'paid',
          paymentMode: paymentData.payment_mode,
          paymentChannel: paymentData.payment_channel,
          paymentDatetime: paymentData.payment_datetime ? new Date(paymentData.payment_datetime) : new Date(),
          status: 'paid',
          paidAt: new Date(),
        },
      })
    }

    const successUrl = new URL('/payment-success', request.url)
    successUrl.searchParams.set('invoice_id', invoice.id)
    successUrl.searchParams.set('invoice_number', invoice.invoiceNumber)
    if (paymentData.transaction_id) {
      successUrl.searchParams.set('transaction_id', paymentData.transaction_id)
    }

    return NextResponse.redirect(successUrl)
  } catch (error: any) {
    console.error('Payment success callback error:', error)
    return NextResponse.redirect(new URL('/payment-error', request.url))
  }
}
