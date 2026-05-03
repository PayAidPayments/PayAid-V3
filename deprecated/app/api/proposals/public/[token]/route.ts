/**
 * Public Proposal View API Route
 * GET /api/proposals/public/[token] - View proposal without login
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'

// GET /api/proposals/public/[token] - Get proposal by public token (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const proposal = await prisma.proposal.findUnique({
      where: { publicToken: params.token },
      include: {
        lineItems: true,
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    if (!proposal.publicViewEnabled) {
      return NextResponse.json(
        { error: 'Public view is disabled for this proposal' },
        { status: 403 }
      )
    }

    // Track view
    if (proposal.status === 'sent' && !proposal.viewedAt) {
      await prisma.proposal.update({
        where: { id: proposal.id },
        data: {
          status: 'viewed',
          viewedAt: new Date(),
        },
      })
    }

    // Return proposal (without sensitive tenant info)
    return NextResponse.json({
      success: true,
      data: {
        id: proposal.id,
        proposalNumber: proposal.proposalNumber,
        title: proposal.title,
        content: proposal.content,
        lineItems: proposal.lineItems,
        subtotal: proposal.subtotal,
        tax: proposal.tax,
        discount: proposal.discount,
        total: proposal.total,
        validUntil: proposal.validUntil,
        status: proposal.status,
        contactName: proposal.contactName,
        createdAt: proposal.createdAt,
        viewedAt: proposal.viewedAt,
        acceptedAt: proposal.acceptedAt,
        customerComments: proposal.customerComments,
      },
    })
  } catch (error: any) {
    console.error('Get public proposal error:', error)
    return NextResponse.json(
      { error: 'Failed to get proposal', message: error.message },
      { status: 500 }
    )
  }
}
