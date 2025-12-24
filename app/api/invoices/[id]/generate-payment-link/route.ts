import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { createPayAidPayments } from '@/lib/payments/payaid'
import { getTenantPayAidConfig } from '@/lib/payments/get-tenant-payment-config'

/**
 * POST /api/invoices/[id]/generate-payment-link
 * Generate a PayAid Payments link for an invoice
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check invoicing module license
    const { tenantId } = await requireFinanceAccess(request)

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

    if (!invoice.customer) {
      return NextResponse.json(
        { error: 'Invoice must have a customer to generate payment link' },
        { status: 400 }
      )
    }

    // Check if payment link already exists and is valid
    if (invoice.paymentLinkUrl && invoice.paymentLinkExpiry) {
      const now = new Date()
      if (invoice.paymentLinkExpiry > now && invoice.paymentStatus !== 'paid') {
        return NextResponse.json({
          paymentLinkUrl: invoice.paymentLinkUrl,
          uuid: invoice.paymentLinkUuid,
          expiryDatetime: invoice.paymentLinkExpiry,
          message: 'Existing payment link is still valid',
        })
      }
    }

    // Get base URL for return URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3000'

    // Get tenant-specific payment gateway config
    const { tenantId: authTenantId } = await requireFinanceAccess(request)
    const paymentConfig = await getTenantPayAidConfig(authTenantId)
    if (!paymentConfig) {
      return NextResponse.json(
        { 
          error: 'Payment gateway not configured. Please configure your payment gateway settings.',
          code: 'PAYMENT_GATEWAY_NOT_CONFIGURED'
        },
        { status: 400 }
      )
    }

    // Generate payment link using PayAid Payments API with tenant-specific config
    const payaidPayments = createPayAidPayments(paymentConfig)
    
    const paymentUrlResponse = await payaidPayments.getPaymentRequestUrl({
      order_id: invoice.invoiceNumber, // Use invoice number as order_id
      amount: invoice.total,
      currency: 'INR',
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
      name: invoice.customer.name || 'Customer',
      email: invoice.customer.email || '',
      phone: invoice.customer.phone || '',
      address_line_1: invoice.customer.address || '',
      city: invoice.customer.city || '',
      state: invoice.customer.state || '',
      country: 'India',
      zip_code: invoice.customer.postalCode || '',
      return_url: `${baseUrl}/api/payments/callback/success?invoice_id=${invoice.id}`,
      return_url_failure: `${baseUrl}/api/payments/callback/failure?invoice_id=${invoice.id}`,
      return_url_cancel: `${baseUrl}/api/payments/callback/cancel?invoice_id=${invoice.id}`,
      mode: paymentConfig.baseUrl.includes('test') || process.env.NODE_ENV !== 'production' ? 'TEST' : 'LIVE',
      expiry_in_minutes: 10080, // 7 days
      udf1: invoice.id, // Store invoice ID in UDF1
      udf2: invoice.tenantId, // Store tenant ID in UDF2
    })

    // Update invoice with payment link details
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

    return NextResponse.json({
      paymentLinkUrl: paymentUrlResponse.url,
      uuid: paymentUrlResponse.uuid,
      expiryDatetime: paymentUrlResponse.expiry_datetime,
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
    console.error('Generate payment link error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate payment link',
        details: error.message 
      },
      { status: 500 }
    )
  }
}
