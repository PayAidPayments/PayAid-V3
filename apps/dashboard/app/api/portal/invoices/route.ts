import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { verifyPortalToken } from '@/lib/portal/token'

/**
 * GET /api/portal/invoices?token=<portal_jwt>
 * List invoices for the customer (contact) encoded in the portal token.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')?.trim()
    if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

    const payload = verifyPortalToken(token)
    const { tenantId, contactId } = payload

    const contact = await prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { id: true, name: true, email: true },
    })
    if (!contact) return NextResponse.json({ error: 'Customer not found' }, { status: 404 })

    const invoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        customerId: contactId,
        status: { in: ['sent', 'issued', 'draft', 'paid'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        invoiceNumber: true,
        status: true,
        total: true,
        dueDate: true,
        createdAt: true,
        paymentStatus: true,
        paymentLinkUrl: true,
        paymentLinkExpiry: true,
      },
    })

    return NextResponse.json({
      customer: { id: contact.id, name: contact.name, email: contact.email },
      invoices: invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        status: inv.status,
        paymentStatus: inv.paymentStatus,
        total: inv.total,
        dueDate: inv.dueDate?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
        hasPaymentLink: !!(
          inv.paymentLinkUrl &&
          inv.paymentLinkExpiry &&
          inv.paymentLinkExpiry > new Date() &&
          inv.paymentStatus !== 'paid'
        ),
      })),
    })
  } catch (e: unknown) {
    const err = e as Error
    if (err.message?.includes('token'))
      return NextResponse.json({ error: err.message }, { status: 401 })
    console.error('[PORTAL_INVOICES]', e)
    return NextResponse.json({ error: 'Failed to load invoices' }, { status: 500 })
  }
}
