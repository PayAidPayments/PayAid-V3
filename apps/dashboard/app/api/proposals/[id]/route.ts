/**
 * GET /api/proposals/[id] — single proposal (tenant-scoped, CRM module).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const proposal = await prisma.proposal.findFirst({
      where: { id, tenantId },
      include: {
        contact: { select: { id: true, name: true, email: true } },
        deal: { select: { id: true, name: true, stage: true } },
        lineItems: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            productName: true,
            description: true,
            quantity: true,
            unitPrice: true,
            discount: true,
            total: true,
          },
        },
        _count: { select: { lineItems: true } },
      },
    })

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: proposal })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    const err = error instanceof Error ? error : new Error(String(error))
    return NextResponse.json(
      { error: 'Failed to load proposal', message: err.message },
      { status: 500 }
    )
  }
}
