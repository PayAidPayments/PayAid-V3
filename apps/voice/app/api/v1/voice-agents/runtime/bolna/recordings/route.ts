/**
 * Tenant bridge: recording lookup.
 *
 * Stage 0 contract: recordings stay with Twilio. This endpoint exposes a
 * tenant-aware lookup so Bolna can attach a recording reference to the
 * `voiceAgentCall` row at call_ended time without us shipping the audio
 * through Bolna's process.
 *
 * GET /api/v1/voice-agents/runtime/bolna/recordings?callSid=...
 *   Returns { recordingUrl, recordingSid } if Twilio has reported one for
 *   the call. Otherwise 404.
 *
 * Auth: shared bridge secret + per-call JWT.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateBolnaBridge } from '@/lib/voice-agent/runtime/bridge-auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const auth = authenticateBolnaBridge(request.headers)
  if (!auth.ok) return auth.response

  const callSid = request.nextUrl.searchParams.get('callSid') || auth.claims.callSid
  if (!callSid) {
    return NextResponse.json({ error: 'callSid is required' }, { status: 400 })
  }

  // Scope by tenant from the JWT — never trust caller-supplied tenant.
  const call = await prisma.voiceAgentCall.findFirst({
    where: { callSid, tenantId: auth.claims.tenantId },
    select: { recordingUrl: true, recordingSid: true, durationSeconds: true },
  })
  if (!call) {
    return NextResponse.json({ error: 'Call not found' }, { status: 404 })
  }
  if (!call.recordingUrl && !call.recordingSid) {
    return NextResponse.json({ error: 'Recording not yet available' }, { status: 404 })
  }

  return NextResponse.json({
    ok: true,
    recordingUrl: call.recordingUrl,
    recordingSid: call.recordingSid,
    durationSeconds: call.durationSeconds,
  })
}
