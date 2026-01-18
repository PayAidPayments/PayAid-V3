/**
 * Voice Agents API
 * POST /api/v1/voice-agents - Create agent
 * GET /api/v1/voice-agents - List agents
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { z } from 'zod'

const createAgentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  language: z.enum(['hi', 'en', 'ta', 'te', 'kn', 'mr', 'gu', 'pa', 'bn', 'ml']).default('hi'),
  voiceId: z.string().optional().nullable(),
  voiceTone: z.string().optional().nullable(),
  systemPrompt: z.string().min(1),
  phoneNumber: z.string().optional().nullable(),
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

// GET /api/v1/voice-agents - List agents
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[VoiceAgents] GET request - User:', {
      userId: (user as any).userId || (user as any).id,
      tenantId: user.tenantId,
      email: (user as any).email,
    })

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const language = searchParams.get('language')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    
    // Also check if tenantId is provided in query params (for debugging/mismatch detection)
    const urlTenantId = searchParams.get('tenantId')
    if (urlTenantId && urlTenantId !== user.tenantId) {
      console.warn('[VoiceAgents] ⚠️ URL tenantId mismatch:', {
        urlTenantId,
        authTenantId: user.tenantId,
      })
    }

    const where: any = {
      tenantId: user.tenantId,
    }

    if (status) where.status = status
    if (language) where.language = language

    console.log('[VoiceAgents] Query where clause:', where)

    // First, check if there are ANY agents in the database (for debugging)
    const allAgentsCount = await prisma.voiceAgent.count({})
    console.log('[VoiceAgents] Total agents in database (all tenants):', allAgentsCount)

    // Check agents for this specific tenant
    const tenantAgentsCount = await prisma.voiceAgent.count({ where: { tenantId: user.tenantId } })
    console.log('[VoiceAgents] Agents for tenantId', user.tenantId, ':', tenantAgentsCount)

    // If no agents found for this tenant, check if there are agents with different tenantIds (for debugging)
    if (tenantAgentsCount === 0 && allAgentsCount > 0) {
      const allAgents = await prisma.voiceAgent.findMany({
        select: { id: true, name: true, tenantId: true },
        take: 10,
      })
      console.log('[VoiceAgents] ⚠️ Found agents but none for this tenant. Sample agents:', allAgents)
      
      // Also check if there are agents with similar tenantIds (case-insensitive, partial match)
      const similarTenants = await prisma.voiceAgent.findMany({
        select: { tenantId: true },
        distinct: ['tenantId'],
        take: 20,
      })
      console.log('[VoiceAgents] All unique tenantIds in database:', similarTenants.map(a => a.tenantId))
    }

    const [agents, total] = await Promise.all([
      prisma.voiceAgent.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.voiceAgent.count({ where }),
    ])

    console.log('[VoiceAgents] Returning agents:', {
      count: agents.length,
      total,
      tenantId: user.tenantId,
    })

    return NextResponse.json({
      agents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[VoiceAgents] List error:', error)
    return NextResponse.json(
      { error: 'Failed to list agents', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

