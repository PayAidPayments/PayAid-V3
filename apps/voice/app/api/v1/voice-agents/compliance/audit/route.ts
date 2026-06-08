/**
 * GET /api/v1/voice-agents/compliance/audit
 * Tenant compliance audit trail (consent, retention, redaction).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { loadVoiceComplianceAudit } from '@/lib/voice-agent/compliance-audit'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'listen')
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

    const entries = await loadVoiceComplianceAudit(prisma, { tenantId, sessionId, limit })
    return NextResponse.json({ ok: true, entries, count: entries.length })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[compliance/audit] GET', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load audit trail' },
      { status: 500 },
    )
  }
}
