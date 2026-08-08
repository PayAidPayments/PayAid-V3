import { NextRequest, NextResponse } from 'next/server'
import {
  requireAnyModuleAccess,
  handleLicenseError,
  LicenseError,
} from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

/**
 * P4 Support tickets — smallest useful slice (slim-deploy safe).
 * Product/DB: new → open → resolved|closed
 *
 * Uses $queryRaw / $executeRaw against "SupportCase" because Ready's
 * generated Prisma client may predate the SupportCase delegate
 * (model exists in schema; table applied via controlled-reconcile).
 *
 * No live send · no SLA/assignment/KB/Unibox · no closed-lane reopen.
 */

const PRODUCT_STATUSES = ['new', 'open', 'resolved', 'closed'] as const
type ProductStatus = (typeof PRODUCT_STATUSES)[number]

const ALLOWED: Record<ProductStatus, ProductStatus[]> = {
  new: ['open', 'closed'],
  open: ['resolved', 'closed'],
  resolved: ['closed'],
  closed: [],
}

type TicketRow = {
  id: string
  tenantId: string
  ticketNumber: string
  subject: string
  description: string | null
  contactId: string | null
  status: string
  priority: string
  channel: string
  assignedToId: string | null
  createdAt: Date
  updatedAt: Date
}

function toProduct(db: string): ProductStatus {
  if (db === 'pending') return 'open'
  if ((PRODUCT_STATUSES as readonly string[]).includes(db)) return db as ProductStatus
  return 'new'
}

function assertTransition(fromDb: string, to: ProductStatus) {
  const from = toProduct(fromDb)
  if (from === to) return
  if (!ALLOWED[from].includes(to)) throw new Error(`Invalid status transition: ${from} → ${to}`)
}

const createSchema = z.object({
  subject: z.string().min(1).optional(),
  description: z.string().optional(),
  contactId: z.string().optional(),
  customerId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  channel: z.enum(['email', 'chat', 'phone', 'whatsapp', 'web']).optional(),
})

const statusSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(PRODUCT_STATUSES),
})

async function requireSupportAccess(request: NextRequest) {
  return requireAnyModuleAccess(request, ['support', 'crm'])
}

function view(row: TicketRow) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    ticketNumber: row.ticketNumber,
    subject: row.subject,
    description: row.description,
    contactId: row.contactId,
    status: toProduct(row.status),
    dbStatus: row.status,
    priority: row.priority,
    channel: row.channel,
    assignedToId: row.assignedToId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function cuidLike() {
  const rand = Math.random().toString(36).slice(2, 10)
  return `p4tkt_${Date.now().toString(36)}_${rand}`
}

async function nextTicketNumber(tenantId: string): Promise<string> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count FROM "SupportCase" WHERE "tenantId" = ${tenantId}
  `
  const count = Number(rows[0]?.count || 0)
  return `TKT-${String(count + 1).padStart(4, '0')}`
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireSupportAccess(request)
    const contactId = request.nextUrl.searchParams.get('contactId') || undefined
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '50', 10) || 50, 100)

    const rows = contactId
      ? await prisma.$queryRaw<TicketRow[]>`
          SELECT id, "tenantId", "ticketNumber", subject, description, "contactId",
                 status, priority, channel, "assignedToId", "createdAt", "updatedAt"
          FROM "SupportCase"
          WHERE "tenantId" = ${tenantId} AND "contactId" = ${contactId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `
      : await prisma.$queryRaw<TicketRow[]>`
          SELECT id, "tenantId", "ticketNumber", subject, description, "contactId",
                 status, priority, channel, "assignedToId", "createdAt", "updatedAt"
          FROM "SupportCase"
          WHERE "tenantId" = ${tenantId}
          ORDER BY "createdAt" DESC
          LIMIT ${limit}
        `

    return NextResponse.json({
      ok: true,
      slice: 'p4-support-tickets-smallest',
      tickets: rows.map((r) => view(r)),
    })
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    const message = error instanceof Error ? error.message : 'Failed to list tickets'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireSupportAccess(request)
    const body = await request.json()

    if (body?.action === 'status') {
      const data = statusSchema.parse(body)
      const existingRows = await prisma.$queryRaw<TicketRow[]>`
        SELECT id, "tenantId", "ticketNumber", subject, description, "contactId",
               status, priority, channel, "assignedToId", "createdAt", "updatedAt"
        FROM "SupportCase"
        WHERE id = ${data.ticketId} AND "tenantId" = ${tenantId}
        LIMIT 1
      `
      const existing = existingRows[0]
      if (!existing) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
      assertTransition(existing.status, data.status)

      await prisma.$executeRaw`
        UPDATE "SupportCase"
        SET status = ${data.status}, "updatedAt" = NOW()
        WHERE id = ${existing.id}
      `
      const updated = await prisma.$queryRaw<TicketRow[]>`
        SELECT id, "tenantId", "ticketNumber", subject, description, "contactId",
               status, priority, channel, "assignedToId", "createdAt", "updatedAt"
        FROM "SupportCase"
        WHERE id = ${existing.id}
        LIMIT 1
      `
      return NextResponse.json({ ok: true, ticket: view(updated[0]) })
    }

    const data = createSchema.parse(body)
    const linkedId = data.contactId || data.customerId || null
    let contactId: string | null = null

    if (linkedId) {
      const contact = await prisma.contact.findFirst({
        where: { id: linkedId, tenantId },
        select: { id: true },
      })
      if (!contact) {
        return NextResponse.json({ error: 'CRM contact not found for tenant' }, { status: 400 })
      }
      contactId = contact.id
    }

    const subject =
      (data.subject || '').trim() || `P4 Support Ticket ${new Date().toISOString().slice(0, 10)}`
    const ticketNumber = await nextTicketNumber(tenantId)
    const id = cuidLike()
    const description = (data.description || 'P4 support tickets thin slice').slice(0, 2000)
    const priority = data.priority || 'medium'
    const channel = data.channel || 'web'
    const metadata = JSON.stringify({ slice: 'p4-support-tickets-smallest' })

    await prisma.$executeRaw`
      INSERT INTO "SupportCase" (
        id, "tenantId", "ticketNumber", subject, description, "contactId",
        status, priority, channel, metadata, "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${tenantId}, ${ticketNumber}, ${subject.slice(0, 200)}, ${description},
        ${contactId}, 'new', ${priority}, ${channel}, ${metadata}::jsonb, NOW(), NOW()
      )
    `

    const created = await prisma.$queryRaw<TicketRow[]>`
      SELECT id, "tenantId", "ticketNumber", subject, description, "contactId",
             status, priority, channel, "assignedToId", "createdAt", "updatedAt"
      FROM "SupportCase"
      WHERE id = ${id}
      LIMIT 1
    `

    return NextResponse.json({ ok: true, ticket: view(created[0]) }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof LicenseError) return handleLicenseError(error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 })
    }
    const message = error instanceof Error ? error.message : 'Failed to process ticket slice'
    const status = /not found|Invalid status|required/i.test(message) ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
