/**
 * GET /api/v1/voice-agents/inbox/export
 * JSON export of voice inbox items (operator / webhook integration).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { loadVoiceInbox } from '@/lib/voice-agent/voice-inbox'
import { recordRedactionApplied, redactVoiceText } from '@/lib/voice-agent/compliance-audit'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireVoiceAccess(request, 'listen')
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200)
    const redact = searchParams.get('redact') === '1' || searchParams.get('redact') === 'true'

    const rawItems = await loadVoiceInbox(prisma, { tenantId, agentId, limit })
    const items = redact
      ? rawItems.map((item) => ({
          ...item,
          callerPhone: item.callerPhone ? redactVoiceText(item.callerPhone) : undefined,
          summary: item.summary ? redactVoiceText(item.summary) : undefined,
        }))
      : rawItems

    if (redact && rawItems.length > 0) {
      void recordRedactionApplied(prisma, {
        tenantId,
        actorId: userId,
        exportKind: 'inbox',
        fieldCount: rawItems.length * 2,
      })
    }

    const exportedAt = new Date().toISOString()

    return NextResponse.json({
      ok: true,
      exportedAt,
      tenantId,
      redacted: redact,
      count: items.length,
      items,
    })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[voice-inbox/export] GET', error)
    const message = error instanceof Error ? error.message : 'Export failed'
    const status = message.includes('token') || message.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ ok: false, error: message }, { status })
  }
}
