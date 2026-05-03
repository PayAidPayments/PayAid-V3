import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { assertTenantFeatureEnabled, TenantFeatureDisabledError } from '@/lib/feature-flags/tenant-feature'
import { trackEvent } from '@/lib/analytics/track'
import { z } from 'zod'

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive().default(1),
  unit_price: z.number().nonnegative(),
  tax_rate: z.number().min(0).max(1).default(0),
  discount_rate: z.number().min(0).max(1).default(0),
})

const createQuoteBodySchema = z.object({
  deal_id: z.string().min(1, 'deal_id is required'),
  contact_id: z.string().optional(),
  line_items: z.array(lineItemSchema).min(1, 'At least one line item required').max(50, 'Maximum 50 line items per quote'),
  valid_until: z.string().datetime().optional(),
  notes: z.string().optional(),
})

/** GET /api/v1/quotes — List all quotes for the tenant */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '50', 10), 100)
    const page = Math.max(parseInt(url.searchParams.get('page') ?? '1', 10), 1)
    const skip = (page - 1) * limit

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where: { tenantId },
        include: {
          lineItems: true,
          deal: { select: { id: true, name: true, value: true, stage: true } },
          contact: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where: { tenantId } }),
    ])

    return NextResponse.json({
      quotes: quotes.map((q) => ({
        id: q.id,
        quote_number: q.quoteNumber,
        deal_id: q.dealId,
        contact_id: q.contactId,
        status: q.status,
        subtotal: q.subtotal,
        discount: q.discount,
        tax: q.tax,
        total: q.total,
        valid_until: q.validUntil,
        notes: q.notes,
        deal: q.deal,
        contact: q.contact,
        line_items: q.lineItems,
        created_at: q.createdAt,
        updated_at: q.updatedAt,
      })),
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    })
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    console.error('List quotes error:', e)
    return NextResponse.json({ error: 'Failed to fetch quotes' }, { status: 500 })
  }
}

/** POST /api/v1/quotes — Create a new quote linked to a deal */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    await assertTenantFeatureEnabled(tenantId, 'm2_cpq')
    const body = await request.json()
    const validated = createQuoteBodySchema.parse(body)

    const deal = await prisma.deal.findFirst({
      where: { id: validated.deal_id, tenantId },
      select: { id: true, contactId: true },
    })

    if (!deal) {
      return NextResponse.json({ error: 'Deal not found', code: 'DEAL_NOT_FOUND' }, { status: 404 })
    }

    const quoteCount = await prisma.quote.count({ where: { tenantId } })
    const quoteNumber = `Q-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`

    const subtotal = validated.line_items.reduce((s, li) => s + li.quantity * li.unit_price, 0)
    const discount = validated.line_items.reduce((s, li) => s + li.quantity * li.unit_price * li.discount_rate, 0)
    const taxable = subtotal - discount
    const tax = validated.line_items.reduce((s, li) => s + li.quantity * li.unit_price * (1 - li.discount_rate) * li.tax_rate, 0)
    const total = taxable + tax

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        dealId: validated.deal_id,
        contactId: validated.contact_id ?? deal.contactId,
        quoteNumber,
        status: 'draft',
        subtotal,
        discount,
        tax,
        total,
        validUntil: validated.valid_until ? new Date(validated.valid_until) : undefined,
        notes: validated.notes,
        lineItems: {
          create: validated.line_items.map((li) => ({
            productName: li.description,
            quantity: li.quantity,
            unitPrice: li.unit_price,
            discount: li.quantity * li.unit_price * li.discount_rate,
            total: li.quantity * li.unit_price * (1 - li.discount_rate) * (1 + li.tax_rate),
          })),
        },
      },
      include: {
        lineItems: true,
        deal: { select: { id: true, name: true } },
        contact: { select: { id: true, name: true } },
      },
    }) as any

    // Product analytics
    trackEvent('quote_created', {
      tenantId,
      userId,
      entityId: quote.id,
      properties: { deal_id: validated.deal_id, line_item_count: validated.line_items.length, total: quote.total },
    })

    // Non-fatal audit trail
    prisma.auditLog.create({
      data: {
        tenantId,
        entityType: 'quote',
        entityId: quote.id,
        changedBy: userId ?? 'system',
        changeSummary: 'quote_created',
        afterSnapshot: {
          quote_number: quote.quoteNumber,
          deal_id: quote.dealId,
          contact_id: quote.contactId ?? null,
          subtotal: quote.subtotal,
          discount: quote.discount,
          tax: quote.tax,
          total: quote.total,
          line_item_count: validated.line_items.length,
           
        } as any,
      },
    }).catch(() => { /* non-fatal */ })

    return NextResponse.json(
      {
        success: true,
        quote: {
          id: quote.id,
          quote_number: quote.quoteNumber,
          deal_id: quote.dealId,
          contact_id: quote.contactId,
          status: quote.status,
          subtotal: quote.subtotal,
          discount: quote.discount,
          tax: quote.tax,
          total: quote.total,
          valid_until: quote.validUntil,
          notes: quote.notes,
          deal: quote.deal,
          contact: quote.contact,
          line_items: quote.lineItems,
          created_at: quote.createdAt,
        },
      },
      { status: 201 }
    )
  } catch (e) {
    if (e instanceof TenantFeatureDisabledError) {
      return NextResponse.json({ error: e.message, code: 'FEATURE_DISABLED' }, { status: 403 })
    }
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: e.errors }, { status: 400 })
    }
    console.error('Create quote error:', e)
    return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 })
  }
}
