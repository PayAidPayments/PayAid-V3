/**
 * GET /api/v1/voice-agents/supervisor/monitor
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { loadSupervisorMonitorFeed } from '@/lib/voice-agent/supervisor-monitor'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const eventLimit = Math.min(Number(searchParams.get('eventLimit') || 50), 100)

    const feed = await loadSupervisorMonitorFeed(prisma, { tenantId, agentId, eventLimit })
    return NextResponse.json({ ok: true, feed })
  } catch (error) {
    console.error('[supervisor/monitor] GET', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to load monitor feed' },
      { status: 500 },
    )
  }
}
