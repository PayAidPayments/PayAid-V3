/**
 * Proposals API Route
 * GET /api/proposals - List proposals
 * POST /api/proposals - Create proposal
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const createProposalSchema = z.object({
  title: z.string().min(1),
  content: z.any(),
  dealId: z.string().optional(),
  contactId: z.string(),
  lineItems: z.array(
    z.object({
      productId: z.string().optional(),
      productName: z.string().min(1),
      description: z.string().optional(),
      quantity: z.number().min(1).default(1),
      unitPrice: z.number().min(0),
      discount: z.number().min(0).default(0),
    })
  ),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  validUntil: z.string().datetime().optional(),
  autoConvertToInvoice: z.boolean().default(true),
  publicViewEnabled: z.boolean().default(true),
  reminderSettings: z
    .object({
      enabled: z.boolean().default(true),
      daysBeforeExpiry: z.array(z.number()).optional(),
    })
    .optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const contactId = searchParams.get('contactId')
    const dealId = searchParams.get('dealId')

    const where: Record<string, unknown> = { tenantId }
    if (status) where.status = status
    if (contactId) where.contactId = contactId
    if (dealId) where.dealId = dealId

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, name: true, stage: true } },
        _count: { select: { lineItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: proposals })
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error))
    return NextResponse.json(
      { error: 'Failed to list proposals', message: err.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = createProposalSchema.parse(body)

    const contact = await prisma.contact.findFirst({
      where: { id: validated.contactId, tenantId },
    })

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      )
    }

    let subtotal = 0
    for (const item of validated.lineItems) {
      subtotal +=
        item.quantity * item.unitPrice - (item.discount || 0)
    }
    const total =
      subtotal - (validated.discount || 0) + (validated.tax || 0)

    const proposalNumber = `PROP-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
    const publicToken = randomBytes(32).toString('hex')
    const expiresAt = validated.validUntil
      ? new Date(validated.validUntil)
      : null

    const proposal = await prisma.proposal.create({
      data: {
        tenantId,
        proposalNumber,
        title: validated.title,
        content: validated.content,
        dealId: validated.dealId,
        contactId: validated.contactId,
        contactEmail: contact.email || '',
        contactName: contact.name,
        publicToken,
        publicViewEnabled: validated.publicViewEnabled,
        lineItems: {
          create: validated.lineItems.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount || 0,
            total: item.quantity * item.unitPrice - (item.discount || 0),
          })),
        },
        subtotal,
        tax: validated.tax || 0,
        discount: validated.discount || 0,
        total,
        validUntil: expiresAt,
        expiresAt: expiresAt,
        autoConvertToInvoice: validated.autoConvertToInvoice,
        reminderSettings: validated.reminderSettings || { enabled: true },
      },
      include: {
        contact: { select: { id: true, name: true, email: true } },
        lineItems: true,
      },
    })

    return NextResponse.json({ success: true, data: proposal })
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }
    const err = error instanceof Error ? error : new Error(String(error))
    return NextResponse.json(
      { error: 'Failed to create proposal', message: err.message },
      { status: 500 }
    )
  }
}
