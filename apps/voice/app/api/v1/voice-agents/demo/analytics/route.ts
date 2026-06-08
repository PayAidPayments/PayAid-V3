/**
 * GET /api/v1/voice-agents/demo/analytics
 * Post-call QA aggregates from ended browser-live demo sessions.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireVoiceRealtimeAccess } from '@/lib/voice-agent/entitlements'
import { aggregateDemoSessionAnalytics } from '@/lib/voice-agent/demo-session-analytics'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceRealtimeAccess(request)
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 200), 500)

    const analytics = await aggregateDemoSessionAnalytics(prisma, {
      tenantId,
      agentId,
      limit,
    })

    return NextResponse.json({ ok: true, analytics })
  } catch (error) {
    console.error('[demo/analytics] GET', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load analytics' },
      { status: 500 },
    )
  }
}
