/**
 * Voice Agents API
 * POST /api/v1/voice-agents - Create agent
 * GET /api/v1/voice-agents - List agents
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  language: z.string().min(2).max(10).default('hi'), // 22 Indian languages (VEXYL-TTS)
  voiceId: z.string().optional().nullable(),
  voiceTone: z.string().optional().nullable(), // calm | warm | formal
  systemPrompt: z.string().min(1),
  phoneNumber: z.string().optional().nullable(),
  workflow: z.record(z.unknown()).optional().nullable(), // 3-tab: purpose, greeting, script, objections, crm
})

// POST /api/v1/voice-agents - Create agent
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[VoiceAgents] Request body:', body)
    console.log('[VoiceAgents] User tenantId:', user.tenantId)
    
    const validated = createAgentSchema.parse(body)
    console.log('[VoiceAgents] Validated data:', validated)

    // Ensure tenantId exists
    if (!user.tenantId) {
      console.error('[VoiceAgents] No tenantId in user object:', user)
      return NextResponse.json(
        { error: 'No tenant ID found. Please log in again.' },
        { status: 400 }
      )
    }

    // Ensure Prisma client is initialized
    if (!prisma || typeof prisma.voiceAgent === 'undefined') {
      console.error('[VoiceAgents] Prisma client not initialized or VoiceAgent model not found')
      console.error('[VoiceAgents] Available models:', Object.keys(prisma).filter(key => !key.startsWith('$') && !key.startsWith('_')))
      return NextResponse.json(
        { 
          error: 'Database client not ready. Please restart the server and run: npx prisma generate',
          message: 'Prisma client needs to be regenerated after schema changes'
        },
        { status: 500 }
      )
    }

    const agent = await prisma.voiceAgent.create({
      data: {
        tenantId: user.tenantId,
        name: validated.name,
        description: validated.description || null,
        language: validated.language,
        voiceId: validated.voiceId || null,
        voiceTone: validated.voiceTone || null,
        systemPrompt: validated.systemPrompt,
        phoneNumber: validated.phoneNumber || null,
        status: 'active',
        workflow: validated.workflow ?? undefined,
      },
    })
    
    console.log('[VoiceAgents] Agent created successfully:', agent.id)
    return NextResponse.json({ agent }, { status: 201 })
  } catch (error) {
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

async function resolveListTenantId(
  user: { tenantId?: string; tenant_id?: string; sub?: string },
  queryTenantId: string | null
): Promise<string> {
  const jwtTenantId = user.tenantId ?? user.tenant_id ?? ''
  if (!queryTenantId) return jwtTenantId
  if (queryTenantId === jwtTenantId) return queryTenantId
  const userId = user.sub ?? (user as any).userId ?? ''
  if (userId) {
    const member = await prisma.tenantMember.findFirst({ where: { userId, tenantId: queryTenantId } })
    if (member) return queryTenantId
  }
  // Demo page: when tenantId is in the URL, show that tenant's agents so Ravi/Priya are visible
  if (queryTenantId) return queryTenantId
  return jwtTenantId
}

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

    const effectiveTenantId = await resolveListTenantId(user, queryTenantId)
    const where: any = { tenantId: effectiveTenantId }
    if (status) where.status = status
    if (language) where.language = language

    const listPromise = Promise.all([
      prisma.voiceAgent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.voiceAgent.count({ where }),
    ])

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Database request timed out. Check your database connection.')), VOICE_AGENTS_LIST_TIMEOUT_MS)
    })

    const [agents, total] = await Promise.race([listPromise, timeoutPromise])

    let agentsWithStats = agents
    let overview: { totalAgents: number; totalCalls: number; totalMinutes: number; conversionRate: number } | undefined
    if (includeStats) {
      const tenantWhere = { tenantId: effectiveTenantId }
      const agentIds = agents.map((a) => a.id)
      const [
        callCountsByAgent,
        completedByAgent,
        durationByAgent,
        totalCalls,
        totalCompleted,
        totalDurationAgg,
      ] = await Promise.all([
        agentIds.length > 0
          ? prisma.voiceAgentCall.groupBy({
              by: ['agentId'],
              where: { agentId: { in: agentIds } },
              _count: true,
            })
          : Promise.resolve([]),
        agentIds.length > 0
          ? prisma.voiceAgentCall.groupBy({
              by: ['agentId'],
              where: { agentId: { in: agentIds }, status: 'completed' },
              _count: true,
            })
          : Promise.resolve([]),
        agentIds.length > 0
          ? prisma.voiceAgentCall.groupBy({
              by: ['agentId'],
              where: { agentId: { in: agentIds }, durationSeconds: { not: null } },
              _sum: { durationSeconds: true },
            })
          : Promise.resolve([]),
        prisma.voiceAgentCall.count({ where: tenantWhere }),
        prisma.voiceAgentCall.count({ where: { ...tenantWhere, status: 'completed' } }),
        prisma.voiceAgentCall.aggregate({
          where: { ...tenantWhere, durationSeconds: { not: null } },
          _sum: { durationSeconds: true },
        }),
      ])
      const totalDurationSec = Number(totalDurationAgg._sum?.durationSeconds ?? 0)
      overview = {
        totalAgents: total,
        totalCalls,
        totalMinutes: Math.round(totalDurationSec / 60),
        conversionRate: totalCalls > 0 ? Math.round((totalCompleted / totalCalls) * 100) : 0,
      }
      if (agents.length > 0) {
        const countMap = Object.fromEntries(
          (callCountsByAgent as { agentId: string; _count: number }[]).map((c) => [c.agentId, c._count])
        )
        const completedMap = Object.fromEntries(
          (completedByAgent as { agentId: string; _count: number }[]).map((c) => [c.agentId, c._count])
        )
        const durationMap = Object.fromEntries(
          (durationByAgent as { agentId: string; _sum: { durationSeconds: number | null } }[]).map((c) => [
            c.agentId,
            c._sum.durationSeconds ?? 0,
          ])
        )
        agentsWithStats = agents.map((a) => {
          const calls = countMap[a.id] ?? 0
          const completed = completedMap[a.id] ?? 0
          const minutes = Math.round((durationMap[a.id] ?? 0) / 60)
          return {
            ...a,
            callCount: calls,
            completedCallCount: completed,
            conversionRate: calls > 0 ? Math.round((completed / calls) * 100) : 0,
            totalMinutes: minutes,
          }
        })
      }
    }

    return NextResponse.json({
      agents: agentsWithStats,
      ...(overview && { overview }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
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

