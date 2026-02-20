/**
 * Accept Proposal API Route
 * POST /api/proposals/[id]/accept - Customer accepts proposal
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const acceptProposalSchema = z.object({
  acceptedBy: z.string().optional(), // Customer name/email
  comments: z.string().optional(),
})

// POST /api/proposals/[id]/accept - Accept proposal (public endpoint, no auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = acceptProposalSchema.parse(body)

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
      include: {
        contact: true,
        lineItems: true,
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    if (proposal.status === 'accepted') {
      return NextResponse.json(
        { error: 'Proposal already accepted' },
        { status: 400 }
      )
    }

    if (proposal.status === 'rejected' || proposal.status === 'expired') {
      return NextResponse.json(
        { error: `Proposal cannot be accepted (status: ${proposal.status})` },
        { status: 400 }
      )
    }

    // Update proposal status
    const updated = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: validated.acceptedBy || proposal.contactName || proposal.contactEmail,
        customerComments: validated.comments
          ? { ...((proposal.customerComments as any) || {}), acceptance: validated.comments }
          : proposal.customerComments,
      },
    })

    // Auto-convert to invoice if enabled
    let invoiceId: string | null = null
    if (proposal.autoConvertToInvoice) {
      try {
        // Create invoice from proposal (Invoice model uses items as JSON)
        const invoiceItems = proposal.lineItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          total: item.total,
        }))

        const invoice = await prisma.invoice.create({
          data: {
            tenantId: proposal.tenantId,
            invoiceNumber: `INV-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
            customerId: proposal.contactId,
            customerName: proposal.contactName ?? proposal.contact?.name ?? undefined,
            customerEmail: proposal.contactEmail ?? proposal.contact?.email ?? undefined,
            subtotal: proposal.subtotal,
            tax: proposal.tax,
            discount: proposal.discount,
            total: proposal.total,
            status: 'draft',
            items: invoiceItems as any,
            notes: `Auto-generated from proposal ${proposal.proposalNumber}`,
          },
        })

        invoiceId = invoice.id

        // Link proposal to invoice
        await prisma.proposal.update({
          where: { id: params.id },
          data: {
            convertedInvoiceId: invoice.id,
            convertedAt: new Date(),
          },
        })
      } catch (invoiceError) {
        console.error('Failed to auto-convert proposal to invoice:', invoiceError)
        // Don't fail the acceptance if invoice creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Proposal accepted',
      data: {
        proposal: updated,
        invoiceId,
      },
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Accept proposal error:', error)
    return NextResponse.json(
      { error: 'Failed to accept proposal', message: error.message },
      { status: 500 }
    )
  }
}
