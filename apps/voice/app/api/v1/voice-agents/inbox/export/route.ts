/**
 * GET /api/v1/voice-agents/inbox/export
 * JSON export of voice inbox items (operator / webhook integration).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireVoiceRealtimeAccess } from '@/lib/voice-agent/entitlements'
import { loadVoiceInbox } from '@/lib/voice-agent/voice-inbox'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceRealtimeAccess(request)
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200)

    const items = await loadVoiceInbox(prisma, { tenantId, agentId, limit })
    const exportedAt = new Date().toISOString()

    return NextResponse.json({
      ok: true,
      exportedAt,
      tenantId,
      count: items.length,
      items,
    })
  } catch (error) {
    console.error('[voice-inbox/export] GET', error)
    const message = error instanceof Error ? error.message : 'Export failed'
    const status = message.includes('token') || message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
