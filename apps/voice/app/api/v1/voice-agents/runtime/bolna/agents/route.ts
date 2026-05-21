/**
 * Tenant bridge: agent CRUD between PayAid and the Bolna sidecar.
 *
 * This route is called from PayAid internal flows (NOT from Bolna). It is
 * gated by `requireModuleAccess` and `VOICE_AGENT_BOLNA_ENABLED=1`.
 *
 * - POST /api/v1/voice-agents/runtime/bolna/agents
 *     body: { agentId: string }
 *     Pushes the agent JSON to Bolna (create or update) and updates the
 *     `bolnaAgentId` + `runtimeSyncedAt` columns on the row.
 *
 * - DELETE /api/v1/voice-agents/runtime/bolna/agents?agentId=...
 *     Tears down the agent on Bolna and clears `bolnaAgentId` locally.
 *
 * See docs/VOICE_AGENT_BOLNA_INTEGRATION_PLAN.md §3.3.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'
import {
  deleteBolnaAgent,
  isBolnaRuntimeEnabled,
  syncBolnaAgent,
} from '@/lib/voice-agent/runtime/bolna'
import { loadApprovedTrainingSnapshot } from '@/lib/voice-agent/training-pack-load'

export const runtime = 'nodejs'

function notEnabled(): NextResponse {
  return NextResponse.json(
    {
      error: 'Bolna runtime is not enabled',
      hint: 'Set VOICE_AGENT_BOLNA_ENABLED=1 and configure BOLNA_API_BASE_URL + BOLNA_BRIDGE_SECRET.',
    },
    { status: 503 },
  )
}

export async function POST(request: NextRequest) {
  if (!isBolnaRuntimeEnabled()) return notEnabled()

  const { tenantId } = await requireModuleAccess(request, 'ai-studio')
  const body = (await request.json().catch(() => ({}))) as { agentId?: string }
  const agentId = body.agentId
  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 })
  }

  const agent = await prisma.voiceAgent.findFirst({ where: { id: agentId, tenantId } })
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  try {
    const trainingPackApproved = await loadApprovedTrainingSnapshot(agent.id, tenantId)
    const synced = await syncBolnaAgent({
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
      compliance: agent.compliance,
      voiceRuntime: agent.voiceRuntime,
      bolnaAgentId: agent.bolnaAgentId,
      runtimeSyncedAt: agent.runtimeSyncedAt,
      trainingPackApproved,
    })

    await prisma.voiceAgent.update({
      where: { id: agent.id },
      data: {
        bolnaAgentId: synced.bolnaAgentId,
        runtimeSyncedAt: synced.syncedAt,
        voiceRuntime: 'bolna',
      },
    })

    return NextResponse.json({
      ok: true,
      bolnaAgentId: synced.bolnaAgentId,
      syncedAt: synced.syncedAt,
    })
  } catch (error) {
    console.error('[runtime/bolna/agents] sync failed:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync agent to Bolna',
        detail: error instanceof Error ? error.message : 'unknown error',
      },
      { status: 502 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!isBolnaRuntimeEnabled()) return notEnabled()

  const { tenantId } = await requireModuleAccess(request, 'ai-studio')
  const agentId = request.nextUrl.searchParams.get('agentId')
  if (!agentId) {
    return NextResponse.json({ error: 'agentId query param is required' }, { status: 400 })
  }

  const agent = await prisma.voiceAgent.findFirst({ where: { id: agentId, tenantId } })
  if (!agent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  if (agent.bolnaAgentId) {
    await deleteBolnaAgent(agent.bolnaAgentId)
  }

  await prisma.voiceAgent.update({
    where: { id: agent.id },
    data: { bolnaAgentId: null, runtimeSyncedAt: null, voiceRuntime: 'native' },
  })

  return NextResponse.json({ ok: true })
}
