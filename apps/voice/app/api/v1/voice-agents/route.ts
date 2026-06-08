/**
 * Voice Agents API
 * POST /api/v1/voice-agents - Create agent
 * GET /api/v1/voice-agents - List agents
 */

import { NextRequest, NextResponse } from 'next/server'
import { createVoiceAgentInputSchema, createVoiceDomainDeps } from '@payaid/domain-voice'
import { authenticateRequest } from '@/lib/middleware/auth'
import { handleVoiceAccessError, requireVoiceAccess } from '@/lib/voice-agent/rbac'
import { z } from 'zod'

const voiceDomain = createVoiceDomainDeps()

// POST /api/v1/voice-agents - Create agent
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireVoiceAccess(request, 'configure')

    const body = await request.json()
    console.log('[VoiceAgents] Request body:', body)
    console.log('[VoiceAgents] User tenantId:', tenantId)
    
    if (!tenantId) {
      console.error('[VoiceAgents] No tenantId in user object:', user)
      return NextResponse.json(
        { error: 'No tenant ID found. Please log in again.' },
        { status: 400 }
      )
    }

    const validated = createVoiceAgentInputSchema.parse({
      ...body,
      tenantId,
    })
    console.log('[VoiceAgents] Validated data:', validated)

    // Domain use case (repository → Prisma today; HTTP client when Voice service is extracted)
    const agent = await voiceDomain.createVoiceAgent(validated)
    
    console.log('[VoiceAgents] Agent created successfully:', agent.id)
    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
    const denied = handleVoiceAccessError(error)
    if (denied) return denied
    if (error instanceof z.ZodError) {
      console.error('[VoiceAgents] Validation error:', error.errors)
      return NextResponse.json(
        { 
          error: 'Validation error', 
          message: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          details: error.errors 
        },
        { status: 400 }
      )
    }

    console.error('[VoiceAgents] Create error:', error)
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error ? error.stack : String(error)
    
    return NextResponse.json(
      { 
        error: 'Failed to create agent',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}

const VOICE_AGENTS_LIST_TIMEOUT_MS = 28_000 // Allow slow DB / cold start; client waits 35s and retries once

// GET /api/v1/voice-agents - List agents
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const language = searchParams.get('language')
    const includeStats = searchParams.get('includeStats') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const queryTenantId = searchParams.get('tenantId')

    const jwtTenantId = user.tenantId ?? user.tenant_id ?? ''
    const userId = user.sub ?? (user as { userId?: string }).userId ?? ''
    const effectiveTenantId = await voiceDomain.resolveListTenantId({
      jwtTenantId,
      queryTenantId,
      userId,
    })

    const listPromise = voiceDomain.listVoiceAgents({
      tenantId: effectiveTenantId,
      status,
      language,
      page,
      limit,
    })

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database request timed out. Check your database connection.')), VOICE_AGENTS_LIST_TIMEOUT_MS)
    })

    const listResult = await Promise.race([listPromise, timeoutPromise])
    const { agents, pagination } = listResult
    const total = pagination.total

    let agentsResponse = agents
    let overview: { totalAgents: number; totalCalls: number; totalMinutes: number; conversionRate: number } | undefined
    if (includeStats) {
      const stats = await voiceDomain.enrichVoiceAgentsWithStats(effectiveTenantId, agents, total)
      agentsResponse = stats.agents
      overview = stats.overview
    }

    return NextResponse.json({
      agents: agentsResponse,
      ...(overview && { overview }),
      pagination,
    })
  } catch (error) {
    console.error('[VoiceAgents] List error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    const isTimeout = msg.includes('timed out')
    return NextResponse.json(
      { error: isTimeout ? 'Database temporarily unavailable. Please try again.' : 'Failed to list agents', details: msg },
      { status: isTimeout ? 503 : 500 }
    )
  }
}

