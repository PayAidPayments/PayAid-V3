/**
 * POST /api/v1/voice-agents/campaigns/tick
 * Process running campaigns for the tenant (cron / operator batch dial).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireVoiceRealtimeAccess } from '@/lib/voice-agent/entitlements'
import { tickRunningCampaigns } from '@/lib/voice-agent/campaign-dialer'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceRealtimeAccess(request)
    const body = (await request.json().catch(() => ({}))) as { maxTicks?: number }
    const results = await tickRunningCampaigns(prisma, {
      tenantId,
      maxTicks: typeof body.maxTicks === 'number' ? body.maxTicks : 3,
    })
    return NextResponse.json({ ok: true, results })
  } catch (error) {
    console.error('[campaigns/tick] POST batch', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Batch tick failed' },
      { status: 500 },
    )
  }
}
