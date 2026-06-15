/**
 * Tenant bridge: outbound call initiation through Bolna.
 *
 * Stage 0 contract: this route is intentionally a thin wrapper. It does NOT
 * own DND scrub, entitlement checks, or campaign pacing — those stay in our
 * existing `lib/voice-agent/telephony-orchestrator.ts`. The orchestrator
 * calls this route only at the moment it actually wants Twilio to dial.
 *
 * - POST /api/v1/voice-agents/runtime/bolna/calls/start
 *     body: { agentId: string, to: string, callSid: string, from?: string }
 *     Returns the public WSS URL Twilio's <Connect><Stream> should hit, plus
 *     the per-call JWT so Bolna can call back into the bridge.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'
import {
  buildBolnaStreamUrl,
  isBolnaRuntimeEnabled,
} from '@/lib/voice-agent/runtime/bolna'

export const runtime = 'nodejs'

interface StartBody {
  agentId?: string
  to?: string
  from?: string
  callSid?: string
}

export async function POST(request: NextRequest) {
  if (!isBolnaRuntimeEnabled()) {
    return NextResponse.json(
      {
        error: 'Bolna runtime is not enabled',
        hint: 'Set VOICE_AGENT_BOLNA_ENABLED=1 + BOLNA_PUBLIC_WS_HOST + BOLNA_BRIDGE_SECRET.',
      },
      { status: 503 },
    )
  }

  const { tenantId } = await requireModuleAccess(request, 'ai-studio')
  const body = (await request.json().catch(() => ({}))) as StartBody

  if (!body.agentId || !body.to || !body.callSid) {
    return NextResponse.json(
      { error: 'agentId, to, and callSid are required' },
      { status: 400 },
    )
  }

  const agent = await prisma.voiceAgent.findFirst({
    where: { id: body.agentId, tenantId, status: 'active' },
  })
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }
  if (!agent.bolnaAgentId) {
    return NextResponse.json(
      {
        error: 'Agent has not been synced to Bolna yet',
        hint: 'POST /api/v1/voice-agents/runtime/bolna/agents { agentId } first.',
      },
      { status: 409 },
    )
  }

  const { streamUrl, jwt, expiresAt } = buildBolnaStreamUrl({
    agent: {
      id: agent.id,
      tenantId: agent.tenantId,
      name: agent.name,
      description: agent.description,
      language: agent.language,
      voiceId: agent.voiceId,
      voiceTone: agent.voiceTone,
      systemPrompt: agent.systemPrompt,
      phoneNumber: agent.phoneNumber,
      status: agent.status,
      knowledgeBase: agent.knowledgeBase,
      functions: agent.functions,
      workflow: agent.workflow,
      voiceRuntime: agent.voiceRuntime,
      bolnaAgentId: agent.bolnaAgentId,
      runtimeSyncedAt: agent.runtimeSyncedAt,
    },
    callSid: body.callSid,
    from: body.from || agent.phoneNumber || '',
    to: body.to,
    payaidOrigin: request.nextUrl.origin,
  })

  return NextResponse.json({ ok: true, streamUrl, jwt, expiresAt })
}
