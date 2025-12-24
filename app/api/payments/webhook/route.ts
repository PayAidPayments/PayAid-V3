import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { createPayAidPayments } from '@/lib/payments/payaid'
import { getTenantPayAidConfig, getTenantPaymentSettings } from '@/lib/payments/get-tenant-payment-config'

/**
 * POST /api/payments/webhook
 * Webhook endpoint for PayAid Payments payment status updates
 * This receives server-to-server callbacks from PayAid Payments
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Extract invoice ID from UDF1 (we stored it there) or UDF2 (tenant ID)
    const invoiceId = body.udf1
    const tenantId = body.udf2
    const orderId = body.order_id // This is the invoice number
    const transactionId = body.transaction_id
    const responseCode = body.response_code
    const responseMessage = body.response_message

    if (!invoiceId && !orderId) {
      console.error('No invoice ID or order ID in webhook')
      return NextResponse.json(
        { error: 'Missing invoice identifier' },
        { status: 400 }
      )
    }

    // Find invoice by ID or invoice number
    const invoice = await prisma.invoice.findFirst({
      where: invoiceId 
        ? { id: invoiceId }
        : { invoiceNumber: orderId },
      include: {
        customer: true,
        tenant: true,
      },
    })

    if (!invoice) {
      console.error(`Invoice not found: ${invoiceId || orderId}`)
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Get tenant-specific payment gateway config for webhook verification
    const paymentConfig = await getTenantPayAidConfig(invoice.tenantId)
    if (!paymentConfig) {
      console.error(`Payment gateway not configured for tenant: ${invoice.tenantId}`)
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 400 }
      )
    }

    // Verify webhook signature using tenant-specific SALT
    const payaidPayments = createPayAidPayments(paymentConfig)
    if (!payaidPayments.verifyWebhookSignature(body)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Determine payment status
    let paymentStatus = 'pending'
    let invoiceStatus = invoice.status
    let paidAt: Date | null = null

    if (responseCode === 0) {
      // Success
      paymentStatus = 'paid'
      invoiceStatus = 'paid'
      paidAt = new Date(body.payment_datetime || new Date())
    } else if (responseCode === 1043) {
      // Cancelled
      paymentStatus = 'cancelled'
    } else {
      // Failed
      paymentStatus = 'failed'
    }

    // Update invoice
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentTransactionId: transactionId,
        paymentStatus,
        paymentMode: body.payment_mode,
        paymentChannel: body.payment_channel,
        paymentDatetime: body.payment_datetime ? new Date(body.payment_datetime) : null,
        status: invoiceStatus,
        paidAt,
      },
    })

    // Log webhook for audit
    console.log(`Payment webhook processed: Invoice ${invoice.invoiceNumber}, Status: ${paymentStatus}, Transaction: ${transactionId}`)

    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed',
      invoiceId: invoice.id,
      status: paymentStatus,
    })
  } catch (error: any) {
    console.error('Payment webhook error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
