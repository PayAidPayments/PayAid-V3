import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET() {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }
  const toggles = await prisma.featureToggle.findMany({
    select: { 
      id: true, 
      featureName: true, 
      isEnabled: true, 
      tenantId: true, 
      settings: true,
      createdAt: true,
      updatedAt: true,
    },
    take: 500,
    orderBy: { createdAt: 'desc' },
  })
  
  const data = toggles.map((t) => ({
    ...t,
    description: (t.settings as any)?.description || null,
    createdAt: t.createdAt?.toISOString(),
    updatedAt: t.updatedAt?.toISOString(),
  }))
  
  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Forbidden'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 })
  }

  try {
    const body = await request.json()
    const { featureName, description, tenantId, isEnabled, settings } = body

    const flag = await prisma.featureToggle.create({
      data: {
        featureName,
        tenantId: tenantId || null, // null for platform-wide flags
        isEnabled: isEnabled || false,
        settings: { ...(settings || {}), description: description || null },
      },
    })

    return NextResponse.json({
      success: true,
      data: flag,
    })
  } catch (e) {
    console.error('Create feature flag error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
