/**
 * LangChain Agent API
 * Provides LangChain-powered agent orchestration with tool composition
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { executeLangChainQuery, createBusinessAgent } from '@/lib/ai/langchain-setup'
import { z } from 'zod'

const querySchema = z.object({
  query: z.string().min(1),
  agentPrompt: z.string().optional(),
  useLangChain: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = querySchema.parse(body)

    // Execute query using LangChain agent
    const response = await executeLangChainQuery(
      validated.query,
      tenantId,
      validated.agentPrompt
    )

    return NextResponse.json({
      success: true,
      response,
      method: 'langchain',
      tenantId,
    })
  } catch (error) {
    console.error('[LangChain API] Error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to process LangChain query',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/ai/langchain - Get available tools
 */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'ai-studio')

    const { createBusinessTools } = await import('@/lib/ai/langchain-setup')
    
    // Get tenant ID for tool creation (tools need tenant context)
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const tools = createBusinessTools(tenantId)

    return NextResponse.json({
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
      })),
      count: tools.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      const { handleLicenseError } = await import('@/lib/middleware/license')
      return handleLicenseError(error)
    }

    return NextResponse.json(
      {
        error: 'Failed to get LangChain tools',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
