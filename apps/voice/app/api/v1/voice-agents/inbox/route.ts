/**
 * GET /api/v1/voice-agents/inbox
 * List voice inbox items (no_crm_inbox / CRM-off browser-live sessions).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { loadVoiceInbox } from '@/lib/voice-agent/voice-inbox'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'listen')
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 50), 100)

    const items = await loadVoiceInbox(prisma, { tenantId, agentId, limit })
    return NextResponse.json({ ok: true, items, count: items.length })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[voice-inbox] GET', error)
    const message = error instanceof Error ? error.message : 'Failed to load inbox'
    const status = message.includes('token') || message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
