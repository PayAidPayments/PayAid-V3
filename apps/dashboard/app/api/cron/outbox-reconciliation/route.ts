import { NextRequest, NextResponse } from 'next/server'
import { reconcileOutboxHealthAcrossTenants } from '@/lib/outbox/reconciliation'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await reconcileOutboxHealthAcrossTenants()
    return NextResponse.json({
      success: true,
      processedTenants: result.processedTenants,
      riskyTenants: result.riskyTenants,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Outbox reconciliation cron failed',
        message: error?.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}
