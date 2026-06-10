/**
 * GET /api/v1/voice-agents/unified-analytics
 * Telephony + browser-live QA in one payload (blueprint unified analytics view).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { loadUnifiedVoiceAnalytics } from '@/lib/voice-agent/unified-voice-analytics'

export const runtime = 'nodejs'

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setUTCHours(23, 59, 59, 999)
  return x
}

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'listen')
    const { searchParams } = new URL(request.url)
    const agentId = searchParams.get('agentId') || undefined
    const period = searchParams.get('period') || 'month'
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const now = new Date()
    let startDate: Date | undefined = startOfDay(now)
    let endDate: Date | undefined = endOfDay(now)
    if (period === 'all') {
      startDate = undefined
      endDate = undefined
    } else if (period === 'week') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
      startDate = startOfDay(startDate)
    } else if (period === 'month') {
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
      startDate = startOfDay(startDate)
    } else if (startDateParam || endDateParam) {
      if (startDateParam) startDate = new Date(startDateParam)
      if (endDateParam) endDate = endOfDay(new Date(endDateParam))
    }

    const analytics = await loadUnifiedVoiceAnalytics(prisma, {
      tenantId,
      agentId,
      startDate,
      endDate,
    })

    return NextResponse.json({ ok: true, analytics, period })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[unified-analytics] GET', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load unified analytics' },
      { status: 500 },
    )
  }
}
