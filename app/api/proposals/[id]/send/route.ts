/**
 * Send Proposal API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const proposal = await prisma.proposal.findFirst({
      where: { id: params.id, tenantId },
      include: { contact: true, lineItems: true },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const updated = await prisma.proposal.update({
      where: { id: params.id },
      data: { status: 'sent', sentAt: new Date() },
    })

    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/proposals/public/${proposal.publicToken}`

    return NextResponse.json({
      success: true,
      message: 'Proposal sent',
      data: { proposal: updated, publicUrl },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to send proposal', message: error.message }, { status: 500 })
  }
}
