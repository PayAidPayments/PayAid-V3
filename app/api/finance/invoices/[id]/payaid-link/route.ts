/**
 * Finance Invoice PayAid Payment Link API Route
 * POST /api/finance/invoices/[id]/payaid-link - Generate PayAid payment link
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { createPaymentLink } from '@/lib/payments/payaid-gateway'
import { ApiResponse } from '@/types/base-modules'
import { formatINR } from '@/lib/currency'

/**
 * Generate PayAid payment link for invoice
 * POST /api/finance/invoices/[id]/payaid-link
 */
export const POST = withErrorHandling(async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const { id } = await params
  const body = await request.json()
  const organizationId = body.organizationId || request.headers.get('x-tenant-id')

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      tenantId: organizationId,
    },
    include: {
      customer: true,
    },
  })

  if (!invoice) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 404,
        error: {
          code: 'INVOICE_NOT_FOUND',
          message: 'Invoice not found',
        },
      },
      { status: 404 }
    )
  }

  if (!invoice.customer) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_CUSTOMER',
          message: 'Invoice must have a customer to generate payment link',
        },
      },
      { status: 400 }
    )
  }

  // Check if valid payment link already exists
  if (invoice.paymentLinkUrl && invoice.paymentLinkExpiry) {
    const now = new Date()
    if (invoice.paymentLinkExpiry > now && invoice.paymentStatus !== 'paid') {
      return NextResponse.json({
        success: true,
        statusCode: 200,
        data: {
          paymentLink: invoice.paymentLinkUrl,
          transactionId: invoice.paymentTransactionId || invoice.invoiceNumber,
          expiresAt: invoice.paymentLinkExpiry,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      })
    }
  }

  // Generate payment link using PayAid Payments
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const paymentResult = await createPaymentLink({
    amount: Number(invoice.total),
    currency: 'INR',
    merchantId: process.env.PAYAID_MERCHANT_ID || '',
    transactionId: `INV-${invoice.invoiceNumber}`,
    customerEmail: invoice.customer.email || '',
    customerPhone: invoice.customer.phone || '',
    description: `Invoice ${invoice.invoiceNumber}`,
    redirectUrl: `${baseUrl}/payments/success`,
    webhookUrl: `${baseUrl}/api/webhooks/payaid`,
    metadata: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      organizationId: invoice.tenantId,
    },
  })

  if (!paymentResult.success) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 500,
        error: {
          code: 'PAYMENT_LINK_GENERATION_FAILED',
          message: paymentResult.error || 'Failed to generate payment link',
        },
      },
      { status: 500 }
    )
  }

  // Update invoice with payment link
  await prisma.invoice.update({
    where: { id },
    data: {
      paymentLinkUrl: paymentResult.paymentLink,
      paymentLinkUuid: paymentResult.transactionId,
      paymentLinkExpiry: paymentResult.expiresAt,
      paymentStatus: 'pending',
      status: invoice.status === 'draft' ? 'sent' : invoice.status,
    },
  })

  const response: ApiResponse<{
    paymentLink: string
    transactionId: string
    expiresAt: Date
    amountFormatted: string
  }> = {
    success: true,
    statusCode: 200,
    data: {
      paymentLink: paymentResult.paymentLink!,
      transactionId: paymentResult.transactionId!,
      expiresAt: paymentResult.expiresAt!,
      amountFormatted: formatINR(Number(invoice.total)),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
