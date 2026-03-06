import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPortalToken } from '@/lib/portal/token'
import { getTenantPayAidConfig } from '@/lib/payments/get-tenant-payment-config'
import { createPayAidPayments } from '@/lib/payments/payaid'

/**
 * POST /api/portal/invoices/[id]/payment-link
 * Body: { token: string }. Returns payment URL for the invoice.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    const body = await request.json().catch(() => ({}))
    const token = (body.token || request.nextUrl.searchParams.get('token'))?.trim()
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

    const payload = verifyPortalToken(token)
    const { tenantId, contactId } = payload

    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, customerId: contactId },
      include: { customer: true },
    })
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    if (invoice.paymentStatus === 'paid') {
      return NextResponse.json({ paymentLinkUrl: null, message: 'Invoice already paid' })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    if (
      invoice.paymentLinkUrl &&
      invoice.paymentLinkExpiry &&
      invoice.paymentLinkExpiry > new Date()
    ) {
      return NextResponse.json({ paymentLinkUrl: invoice.paymentLinkUrl, message: 'Existing link' })
    }

    const paymentConfig = await getTenantPayAidConfig(tenantId)
    if (!paymentConfig)
      return NextResponse.json({ error: 'Payment gateway not configured' }, { status: 400 })

    const payaidPayments = createPayAidPayments(paymentConfig)
    const res = await payaidPayments.getPaymentRequestUrl({
      order_id: invoice.invoiceNumber,
      amount: invoice.total,
      currency: 'INR',
      description: `Payment for Invoice ${invoice.invoiceNumber}`,
      name: invoice.customer?.name || 'Customer',
      email: invoice.customer?.email || '',
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
      expiry_in_minutes: 10080,
      udf1: invoice.id,
      udf2: invoice.tenantId,
    })

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        paymentLinkUrl: res.url,
        paymentLinkUuid: res.uuid,
        paymentLinkExpiry: new Date(res.expiry_datetime),
        paymentStatus: 'pending',
        status: invoice.status === 'draft' ? 'sent' : invoice.status,
      },
    })

    return NextResponse.json({ paymentLinkUrl: res.url, message: 'Link generated' })
  } catch (e: unknown) {
    const err = e as Error
    if (err.message?.includes('token'))
      return NextResponse.json({ error: err.message }, { status: 401 })
    console.error('[PORTAL_PAYMENT_LINK]', e)
    return NextResponse.json({ error: 'Failed to get payment link' }, { status: 500 })
  }
}
