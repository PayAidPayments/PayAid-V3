/**
 * Reject Proposal API Route
 * POST /api/proposals/[id]/reject - Customer rejects proposal
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const rejectProposalSchema = z.object({
  rejectionReason: z.string().min(1),
  rejectedBy: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const validated = rejectProposalSchema.parse(body)

    const proposal = await prisma.proposal.findUnique({
      where: { id: params.id },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    if (proposal.status === 'accepted') {
      return NextResponse.json({ error: 'Proposal already accepted' }, { status: 400 })
    }

    const updated = await prisma.proposal.update({
      where: { id: params.id },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason: validated.rejectionReason,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Proposal rejected',
      data: updated,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Failed to reject proposal', message: error.message }, { status: 500 })
  }
}
