import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

/** GET /api/crm/cpq/quotes/[id] - Single quote by id (tenant-scoped) */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id } = await params

    const quote = await prisma.quote.findFirst({
      where: { id, tenantId },
      include: {
        lineItems: true,
        deal: { select: { id: true, name: true, value: true, stage: true } },
        contact: { select: { id: true, name: true, email: true } },
      },
    })

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, quote })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get quote error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote', message: error?.message },
      { status: 500 }
    )
  }
}
