import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { routeToAgent, getAgent, type AgentId } from '@/lib/ai/agents'
import { getBusinessContext } from '@/lib/ai/business-context-builder'
import { z } from 'zod'

const cofounderSchema = z.object({
  message: z.string().min(1),
  agentId: z.enum([
    'cofounder', 'finance', 'sales', 'marketing', 'hr', 'website', 'restaurant', 'retail', 'manufacturing',
    'growth-strategist', 'operations', 'product', 'industry-expert', 'analytics', 'customer-success',
    'compliance', 'fundraising', 'market-research', 'scaling', 'tech-advisor', 'design', 'documentation'
  ]).optional(),
  context: z.object({
    module: z.string().optional(),
    tenantId: z.string().optional(),
  }).optional(),
})

/**
 * POST /api/ai/cofounder
 * AI Co-Founder multi-agent endpoint
 * Routes messages to appropriate specialist agents or uses Co-Founder orchestrator
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate and get tenant
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = cofounderSchema.parse(body)

    // Route to appropriate agent
    const agentId = routeToAgent(validated.message, validated.agentId as AgentId | undefined)
    const agent = getAgent(agentId)

    console.log(`[COFOUNDER] Routing to agent: ${agentId}`, {
      message: validated.message.substring(0, 50),
      tenantId,
      userId,
    })

    // Get business context for this agent's data scopes
    let businessContext = ''
    try {
      businessContext = await getBusinessContext(tenantId, validated.message, agent.dataScopes)
    } catch (contextError) {
      console.error('[COFOUNDER] Error getting business context:', contextError)
      businessContext = 'Business context unavailable. Please try again.'
    }

    // Build system prompt with agent-specific instructions
    const systemPrompt = `${agent.systemPrompt}

IMPORTANT: You are the ${agent.name} agent. Focus ONLY on your domain expertise.
${agent.id !== 'cofounder' ? 'If the question is outside your domain, acknowledge it and suggest consulting the Co-Founder agent or the relevant specialist.' : 'You can coordinate with specialist agents when needed.'}

Current business context:
${businessContext || 'No specific business context available.'}

Tenant ID: ${tenantId}
User ID: ${userId}`

    // Use the existing AI chat infrastructure
    // Import clients using the same pattern as chat route
    const { getGroqClient } = await import('@/lib/ai/groq')
    const { getOllamaClient } = await import('@/lib/ai/ollama')
    const { getHuggingFaceClient } = await import('@/lib/ai/huggingface')
    
    // Build user message with context
    const userMessage = `${validated.message}\n\n${businessContext}`
    
    // Try Groq first, fallback to Ollama, then HuggingFace
    let response = ''
    let usedService = 'unknown'
    
    try {
      const groq = getGroqClient()
      const groqResponse = await groq.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ])
      response = groqResponse.message || ''
      usedService = 'groq'
    } catch (groqError) {
      console.warn('[COFOUNDER] Groq failed, trying Ollama:', groqError)
      try {
        const ollama = getOllamaClient()
        const ollamaResponse = await ollama.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ])
        response = ollamaResponse.message || ''
        usedService = 'ollama'
      } catch (ollamaError) {
        console.warn('[COFOUNDER] Ollama failed, trying HuggingFace:', ollamaError)
        try {
          const huggingFace = getHuggingFaceClient()
          const hfResponse = await huggingFace.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ])
          response = hfResponse.message || ''
          usedService = 'huggingface'
        } catch (hfError) {
          console.error('[COFOUNDER] All AI services failed:', hfError)
          throw new Error('AI services unavailable. Please try again later.')
        }
      }
    }

    return NextResponse.json({
      message: response,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      suggestedActions: [], // Could be enhanced with action suggestions
      context: {
        tenantId,
        dataScopes: agent.dataScopes,
      },
    })
  } catch (error) {
    console.error('[COFOUNDER] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to process cofounder request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/cofounder
 * Get available agents
 * Requires authentication to ensure tenant context
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate to get tenant context (even though we don't use it for listing agents)
    // This ensures the endpoint is protected and consistent with POST
    await requireModuleAccess(request, 'ai-studio')

    const { getAllAgents } = await import('@/lib/ai/agents')
    const agents = getAllAgents()

    return NextResponse.json({
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        keywords: agent.keywords,
      })),
    })
  } catch (error) {
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch agents',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

