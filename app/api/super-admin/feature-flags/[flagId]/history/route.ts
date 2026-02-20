import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/requireSuperAdmin'
import { prisma } from '@/lib/db/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flagId: string }> }
) {
  try {
    await requireSuperAdmin()
  } catch (e) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { flagId } = await params

    // Get audit logs for this feature flag
    const history = await prisma.auditLog.findMany({
      where: {
        entityType: 'FeatureToggle',
        entityId: flagId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 20,
      select: {
        id: true,
        changedBy: true,
        changeSummary: true,
        beforeSnapshot: true,
        afterSnapshot: true,
        timestamp: true,
        ipAddress: true,
      },
    })

    return NextResponse.json({ data: history })
  } catch (e) {
    console.error('Feature flag history error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
