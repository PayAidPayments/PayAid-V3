/**
 * Proposal Detail API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const proposal = await prisma.proposal.findFirst({
      where: { id: params.id, tenantId },
      include: {
        contact: { select: { id: true, name: true, email: true, phone: true, company: true } },
        deal: { select: { id: true, name: true, stage: true, value: true } },
        lineItems: true,
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: proposal })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to get proposal', message: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const updateData: any = {}

    if (body.title) updateData.title = body.title
    if (body.content) updateData.content = body.content
    if (body.status) updateData.status = body.status
    if (body.validUntil) {
      updateData.validUntil = new Date(body.validUntil)
      updateData.expiresAt = new Date(body.validUntil)
    }
    if (body.autoConvertToInvoice !== undefined) updateData.autoConvertToInvoice = body.autoConvertToInvoice
    if (body.publicViewEnabled !== undefined) updateData.publicViewEnabled = body.publicViewEnabled
    if (body.reminderSettings) updateData.reminderSettings = body.reminderSettings

    const proposal = await prisma.proposal.update({
      where: { id: params.id, tenantId },
      data: updateData,
      include: {
        contact: { select: { id: true, name: true, email: true } },
        lineItems: true,
      },
    })

    return NextResponse.json({ success: true, data: proposal })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update proposal', message: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    await prisma.proposal.delete({ where: { id: params.id, tenantId } })
    return NextResponse.json({ success: true, message: 'Proposal deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to delete proposal', message: error.message }, { status: 500 })
  }
}
