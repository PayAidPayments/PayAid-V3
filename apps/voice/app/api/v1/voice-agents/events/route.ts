/**
 * GET /api/v1/voice-agents/events
 * Query durable VoiceEvent rows (blueprint event bus).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'listen')
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId') || undefined
    const callId = searchParams.get('callId') || undefined
    const event = searchParams.get('event') || undefined
    const limit = Math.min(Number(searchParams.get('limit') || 50), 200)

    const events = await prisma.voiceEvent.findMany({
      where: {
        tenantId,
        ...(sessionId ? { sessionId } : {}),
        ...(callId ? { callId } : {}),
        ...(event ? { event } : {}),
      },
      orderBy: { occurredAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ ok: true, events, count: events.length })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    console.error('[voice-events] GET', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Failed to load events' },
      { status: 500 },
    )
  }
}
