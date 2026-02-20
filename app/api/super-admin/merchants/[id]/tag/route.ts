import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id: merchantId } = await params
    const body = await request.json()
    const { tag } = body

    if (!['monitor', 'freeze'].includes(tag)) {
      return NextResponse.json({ error: 'Invalid tag' }, { status: 400 })
    }

    // Update tenant with tag (store in settings JSON field)
    const tenant = await prisma.tenant.findUnique({
      where: { id: merchantId },
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Merchant not found' }, { status: 404 })
    }

    const settings = (tenant.invoiceSettings as any) || {}
    settings.riskTag = tag
    if (tag === 'freeze') {
      settings.frozenAt = new Date().toISOString()
    }

    await prisma.tenant.update({
      where: { id: merchantId },
      data: {
        invoiceSettings: settings,
        ...(tag === 'freeze' ? { status: 'suspended' } : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Tag merchant error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
