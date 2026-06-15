/**
 * GET /api/v1/voice-agents/crm-links
 * List Voice ↔ CRM link records for a session or call.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { loadVoiceCrmLinks } from '@/lib/voice-agent/crm-link'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'listen')
    const { searchParams } = new URL(request.url)
    const voiceSessionId = searchParams.get('sessionId') || undefined
    const voiceCallId = searchParams.get('callId') || undefined
    const entityType = searchParams.get('entityType') || undefined
    const entityId = searchParams.get('entityId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

    const links = await loadVoiceCrmLinks(prisma, {
      tenantId,
      voiceSessionId,
      voiceCallId,
      entityType: entityType as 'case' | 'invoice' | undefined,
      entityId,
      limit,
    })
    return NextResponse.json({ ok: true, links, count: links.length })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[crm-links] GET', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load CRM links' },
      { status: 500 },
    )
  }
}
