import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { createPayAidPayments } from '@/lib/payments/payaid'
import { getTenantPayAidConfig } from '@/lib/payments/get-tenant-payment-config'
import { mediumPriorityQueue } from '@/lib/queue/bull'

/**
 * POST /api/invoices/[id]/send-with-payment
 * Generate payment link and send invoice via email
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check invoicing module license
    const { tenantId } = await requireFinanceAccess(request)

    const body = await request.json()
    const email = body.email || body.customerEmail

    // Get invoice with customer and tenant details
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: resolvedParams.id,
        tenantId: tenantId,
      },
      include: {
        customer: true,
        tenant: true,
      },
    })

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    // Determine recipient email
    const recipientEmail = email || invoice.customer?.email
    if (!recipientEmail) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }

    // Get tenant-specific payment gateway config
    const paymentConfig = await getTenantPayAidConfig(tenantId)
    if (!paymentConfig) {
      return NextResponse.json(
        { 
          error: 'Payment gateway not configured. Please configure your payment gateway settings.',
          code: 'PAYMENT_GATEWAY_NOT_CONFIGURED'
        },
        { status: 400 }
      )
    }

    // Generate payment link first
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'

    const payaidPayments = createPayAidPayments(paymentConfig)
    
    const paymentUrlResponse = await payaidPayments.getPaymentRequestUrl({
      order_id: invoice.invoiceNumber,
      amount: invoice.total,
      currency: 'INR',
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
      name: invoice.customer?.name || 'Customer',
      email: recipientEmail,
      phone: invoice.customer?.phone || '',
      address_line_1: invoice.customer?.address || '',
      city: invoice.customer?.city || '',
      state: invoice.customer?.state || '',
      country: 'India',
      zip_code: invoice.customer?.postalCode || '',
      return_url: `${baseUrl}/api/payments/callback/success?invoice_id=${invoice.id}`,
      return_url_failure: `${baseUrl}/api/payments/callback/failure?invoice_id=${invoice.id}`,
      return_url_cancel: `${baseUrl}/api/payments/callback/cancel?invoice_id=${invoice.id}`,
      mode: paymentConfig.baseUrl.includes('test') || process.env.NODE_ENV !== 'production' ? 'TEST' : 'LIVE',
      expiry_in_minutes: 10080, // 7 days
      udf1: invoice.id,
      udf2: invoice.tenantId,
    })

    // Update invoice with payment link
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentLinkUrl: paymentUrlResponse.url,
        paymentLinkUuid: paymentUrlResponse.uuid,
        paymentLinkExpiry: new Date(paymentUrlResponse.expiry_datetime),
        paymentStatus: 'pending',
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
      },
    })

    // Queue email sending
    await mediumPriorityQueue.add('send-invoice-with-payment-link', {
      invoiceId: invoice.id,
      recipientEmail,
      paymentLinkUrl: paymentUrlResponse.url,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer?.name || 'Customer',
      amount: invoice.total,
      dueDate: invoice.dueDate,
      tenantName: invoice.tenant.name,
    })

    return NextResponse.json({
      success: true,
      message: 'Invoice sent with payment link',
      paymentLinkUrl: paymentUrlResponse.url,
      invoice: {
        id: updatedInvoice.id,
        invoiceNumber: updatedInvoice.invoiceNumber,
        status: updatedInvoice.status,
        paymentStatus: updatedInvoice.paymentStatus,
      },
    })
  } catch (error: any) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Send invoice with payment error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send invoice with payment link',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
