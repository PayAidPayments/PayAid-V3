/**
 * Send Proposal API Route
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const proposal = await prisma.proposal.findFirst({
      where: { id: id, tenantId },
      include: { contact: true, lineItems: true },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    const updated = await prisma.proposal.update({
      where: { id: id },
      data: { status: 'sent', sentAt: new Date() },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const publicUrl = `${baseUrl}/proposals/public/${proposal.publicToken}`
    const acceptApiUrl = `${baseUrl}/api/proposals/${proposal.id}/accept?token=${encodeURIComponent(proposal.publicToken)}`

    return NextResponse.json({
      success: true,
      message: 'Proposal sent',
      data: { proposal: updated, publicUrl, acceptApiUrl },
    })
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to send proposal', message: error.message }, { status: 500 })
  }
}
