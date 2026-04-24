import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'sales')
    const { id } = await params

    const existing = await prisma.landingPage.findFirst({ where: { id, tenantId } })
    if (!existing) {
      return NextResponse.json({ error: 'Sales page not found' }, { status: 404 })
    }

    const updated = await prisma.landingPage.update({
      where: { id },
      data: { status: 'DRAFT' },
      select: { id: true, name: true, slug: true, status: true, updatedAt: true },
    })

    return NextResponse.json({
      ...updated,
      event: 'sales_page.unpublished',
      compatibility: { mode: 'landing-page-bridge' },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Unpublish sales page error:', error)
    return NextResponse.json({ error: 'Failed to unpublish sales page' }, { status: 500 })
  }
}
