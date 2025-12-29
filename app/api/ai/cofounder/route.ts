import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { routeToAgent, getAgent, getAllAgents, type AgentId } from '@/lib/ai/agents'
import { getBusinessContext } from '@/lib/ai/business-context-builder'
import { prisma } from '@/lib/db/prisma'
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
  conversationId: z.string().optional(), // Existing conversation ID
  useMultiSpecialist: z.boolean().optional().default(false), // Enable multi-specialist coordination
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
    let agentId = routeToAgent(validated.message, validated.agentId as AgentId | undefined)
    let agent = getAgent(agentId)

    // Multi-specialist coordination: If cofounder agent and useMultiSpecialist is true,
    // identify which specialists should be involved
    let involvedAgents: Array<{ id: string; name: string }> = [{ id: agent.id, name: agent.name }]
    
    if (agentId === 'cofounder' && validated.useMultiSpecialist) {
      // Analyze message to identify relevant specialists
      const allAgents = getAllAgents()
      const lowerMessage = validated.message.toLowerCase()
      
      const relevantAgents = allAgents
        .filter(a => a.id !== 'cofounder')
        .filter(a => {
          // Check if agent's keywords match the message
          return a.keywords.some(keyword => lowerMessage.includes(keyword))
        })
        .slice(0, 3) // Limit to 3 specialists
        .map(a => ({ id: a.id, name: a.name }))
      
      if (relevantAgents.length > 0) {
        involvedAgents = [{ id: agent.id, name: agent.name }, ...relevantAgents]
        console.log(`[COFOUNDER] Multi-specialist coordination: ${involvedAgents.map(a => a.name).join(', ')}`)
      }
    }

    console.log(`[COFOUNDER] Routing to agent: ${agentId}`, {
      message: validated.message.substring(0, 50),
      tenantId,
      userId,
      involvedAgents: involvedAgents.length,
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
    let systemPrompt = `${agent.systemPrompt}

IMPORTANT: You are the ${agent.name} agent. Focus ONLY on your domain expertise.
${agent.id !== 'cofounder' ? 'If the question is outside your domain, acknowledge it and suggest consulting the Co-Founder agent or the relevant specialist.' : 'You can coordinate with specialist agents when needed.'}`

    // Add multi-specialist coordination instructions for cofounder
    if (agentId === 'cofounder' && involvedAgents.length > 1) {
      systemPrompt += `\n\nMULTI-SPECIALIST COORDINATION:
The following specialists are also involved in this conversation: ${involvedAgents.slice(1).map(a => a.name).join(', ')}
You should synthesize insights from multiple perspectives and provide comprehensive advice that considers all relevant domains.`
    }

    systemPrompt += `

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

    // Extract suggested actions from response (simple pattern matching)
    const suggestedActions: Array<{ action: string; description: string; priority: 'low' | 'medium' | 'high' }> = []
    
    // Look for action patterns in the response
    const actionPatterns = [
      /(?:should|must|need to|recommend|suggest).*?([A-Z][^.!?]+[.!?])/gi,
      /(?:action|task|step|next):\s*([A-Z][^.!?]+[.!?])/gi,
    ]
    
    actionPatterns.forEach(pattern => {
      const matches = response.matchAll(pattern)
      for (const match of matches) {
        if (match[1] && match[1].length > 10 && match[1].length < 200) {
          suggestedActions.push({
            action: match[1].trim(),
            description: match[1].trim(),
            priority: match[1].toLowerCase().includes('urgent') || match[1].toLowerCase().includes('critical') ? 'high' : 'medium',
          })
        }
      }
    })

    // Limit to top 5 actions
    const topActions = suggestedActions.slice(0, 5)

    // Save conversation to database
    let conversationId = validated.conversationId
    const userMessageData = {
      role: 'user' as const,
      content: validated.message,
      timestamp: new Date().toISOString(),
    }
    const assistantMessage = {
      role: 'assistant' as const,
      content: response,
      timestamp: new Date().toISOString(),
      agent: {
        id: agent.id,
        name: agent.name,
      },
    }

    try {
      if (conversationId) {
        // Update existing conversation
        const existing = await prisma.aICofounderConversation.findFirst({
          where: {
            id: conversationId,
            tenantId,
            userId,
          },
        })

        if (existing) {
          const messages = (existing.messages as any[]) || []
          const updatedMessages = [...messages, userMessageData, assistantMessage]
          
          await prisma.aICofounderConversation.update({
            where: { id: conversationId },
            data: {
              messages: updatedMessages,
              messageCount: updatedMessages.length,
              lastMessageAt: new Date(),
              suggestedActions: topActions.length > 0 ? (topActions as any) : existing.suggestedActions,
            },
          })
        } else {
          conversationId = undefined // Create new if not found
        }
      }

      if (!conversationId) {
        // Create new conversation
        const title = validated.message.substring(0, 50)
        const newConversation = await prisma.aICofounderConversation.create({
          data: {
            tenantId,
            userId,
            title,
            agentId: agent.id,
            messages: [userMessageData, assistantMessage],
            messageCount: 2,
            lastMessageAt: new Date(),
            suggestedActions: topActions.length > 0 ? (topActions as any) : undefined,
          },
        })
        conversationId = newConversation.id
      }
    } catch (dbError) {
      console.error('[COFOUNDER] Error saving conversation:', dbError)
      // Don't fail the request if conversation saving fails
    }

    return NextResponse.json({
      message: response,
      agent: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
      },
      suggestedActions: topActions,
      involvedAgents: involvedAgents,
      conversationId,
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

