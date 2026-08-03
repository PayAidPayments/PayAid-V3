import { NextRequest, NextResponse } from 'next/server'
import {
  requireAnyModuleAccess,
  handleLicenseError,
  LicenseError,
} from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * P3 Finance invoices — smallest useful slice (slim-deploy safe).
 * Product statuses: draft | issued | paid | cancelled
 * DB stores issued as "sent" (existing hub vocabulary).
 * Mark-paid only — no new payment gateway / no live send / no GST rebuild.
 */

const PRODUCT_STATUSES = ['draft', 'issued', 'paid', 'cancelled'] as const
type ProductStatus = (typeof PRODUCT_STATUSES)[number]

const DB_STATUS = {
  draft: 'draft',
  issued: 'sent',
  paid: 'paid',
  cancelled: 'cancelled',
} as const

const DB_TO_PRODUCT: Record<string, ProductStatus> = {
  draft: 'draft',
  sent: 'issued',
  viewed: 'issued',
  overdue: 'issued',
  paid: 'paid',
  cancelled: 'cancelled',
}

const ALLOWED: Record<ProductStatus, ProductStatus[]> = {
  draft: ['issued', 'cancelled'],
  issued: ['paid', 'cancelled'],
  paid: [],
  cancelled: [],
}

function toProduct(db: string): ProductStatus {
  return DB_TO_PRODUCT[db] || 'draft'
}

function assertTransition(fromDb: string, to: ProductStatus) {
  const from = toProduct(fromDb)
  if (from === to) return
  if (!ALLOWED[from].includes(to)) throw new Error(`Invalid status transition: ${from} → ${to}`)
}

const createSchema = z.object({
  customerId: z.string().optional(),
  contactId: z.string().optional(), // alias for CRM contact → customerId
  customerName: z.string().min(1).optional(),
  customerEmail: z.string().email().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().min(3).max(3).optional(),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
})

const statusSchema = z.object({
  invoiceId: z.string().min(1),
  status: z.enum(PRODUCT_STATUSES),
})

async function requireFinanceAccess(request: NextRequest) {
  return requireAnyModuleAccess(request, ['finance', 'crm'])
}

function view(row: {
  id: string
  tenantId: string
  invoiceNumber: string
  status: string
  customerId: string | null
  customerName: string | null
  customerEmail: string | null
  subtotal: number
  tax: number
  total: number
  currency: string
  notes: string | null
  paidAt: Date | null
  invoiceDate: Date
  dueDate: Date | null
  createdAt: Date
}) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    invoiceNumber: row.invoiceNumber,
    status: toProduct(row.status),
    dbStatus: row.status,
    customerId: row.customerId,
    customerName: row.customerName,
    customerEmail: row.customerEmail,
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    currency: row.currency,
    notes: row.notes,
    paidAt: row.paidAt,
    invoiceDate: row.invoiceDate,
    dueDate: row.dueDate,
    createdAt: row.createdAt,
  }
}

function nextInvoiceNumber() {
  const stamp = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `P3-${stamp}-${rand}`
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireFinanceAccess(request)
    const customerId = request.nextUrl.searchParams.get('customerId') || undefined
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10) || 50, 100)

    const rows = await prisma.invoice.findMany({
      where: {
        tenantId,
        ...(customerId ? { customerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      ok: true,
      slice: 'p3-finance-invoice-smallest',
      invoices: rows.map((r) => view(r)),
    })
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    const message = error instanceof Error ? error.message : 'Failed to list invoices'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireFinanceAccess(request)
    const body = await request.json()

    if (body?.action === 'status') {
      const data = statusSchema.parse(body)
      const existing = await prisma.invoice.findFirst({
        where: { id: data.invoiceId, tenantId },
      })
      if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      assertTransition(existing.status, data.status)

      const nextDb = DB_STATUS[data.status]
      const invoice = await prisma.invoice.update({
        where: { id: existing.id },
        data: {
          status: nextDb,
          ...(data.status === 'paid'
            ? { paidAt: existing.paidAt || new Date(), paymentStatus: 'paid' }
            : {}),
          ...(data.status === 'cancelled' && existing.status !== 'cancelled'
            ? { paymentStatus: existing.paymentStatus || 'cancelled' }
            : {}),
        },
      })

      return NextResponse.json({
        ok: true,
        invoice: view(invoice),
        markPaid: data.status === 'paid',
        paymentGateway: false,
      })
    }

    const data = createSchema.parse(body)
    const linkedId = data.customerId || data.contactId || null

    let customerId: string | null = null
    let customerName = (data.customerName || '').trim()
    let customerEmail = data.customerEmail || null

    if (linkedId) {
      const contact = await prisma.contact.findFirst({
        where: { id: linkedId, tenantId },
        select: { id: true, name: true, email: true },
      })
      if (!contact) {
        return NextResponse.json({ error: 'CRM contact not found for tenant' }, { status: 400 })
      }
      customerId = contact.id
      customerName = contact.name
      customerEmail = contact.email || customerEmail
    } else if (!customerName) {
      customerName = 'P3 Finance Slice Customer'
    }

    const amount = data.amount ?? 1000
    const tax = 0
    const total = amount + tax
    const invoiceNumber = nextInvoiceNumber()

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        invoiceNumber,
        status: DB_STATUS.draft,
        subtotal: amount,
        tax,
        total,
        currency: (data.currency || 'INR').toUpperCase(),
        customerId: customerId || undefined,
        customerName,
        customerEmail: customerEmail || undefined,
        notes: data.notes || 'P3 finance invoice thin slice',
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        items: [
          {
            description: 'P3 slice line item',
            quantity: 1,
            rate: amount,
            amount,
          },
        ],
      },
    })

    return NextResponse.json(
      {
        ok: true,
        invoice: view(invoice),
        reminderHook: { created: false, sent: false },
        paymentGateway: false,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Failed to process invoice slice'
    const status = /not found|Invalid status|required/i.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
