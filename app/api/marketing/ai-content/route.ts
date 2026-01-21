/**
 * Marketing AI Content Generation API Route
 * POST /api/marketing/ai-content - Generate AI content
 * GET /api/marketing/ai-content - List generated content
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { withErrorHandling } from '@/lib/api/route-wrapper'
import { ApiResponse, AIContentRequest } from '@/types/base-modules'
import { GenerateAIContentSchema } from '@/modules/shared/marketing/types'
// AI content generation - using existing AI services
async function generateAIContent(params: { prompt: string; model?: string; maxTokens?: number }): Promise<{ content: string }> {
  // Use Ollama or other AI service
  // This is a placeholder - integrate with your existing AI gateway
  try {
    const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: params.model || 'llama3',
        prompt: params.prompt,
        stream: false,
      }),
    })
    const data = await response.json()
    return { content: data.response || 'Content generation failed' }
  } catch (error) {
    console.error('AI content generation error:', error)
    return { content: 'Content generation failed. Please try again.' }
  }
}

/**
 * Generate AI content
 * POST /api/marketing/ai-content
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json()
  const validatedData = GenerateAIContentSchema.parse(body)

  // Build prompt for AI generation
  const prompt = `Generate ${validatedData.contentType} content for ${validatedData.industry} industry.
  
Requirements:
- Tone: ${validatedData.tone}
- ${validatedData.includesCallToAction ? 'Include a call-to-action' : 'No call-to-action needed'}
- Target audience: Indian SMBs
- Use Indian Rupee (₹) for any monetary references
- Keep it professional and relevant to Indian market

User prompt: ${validatedData.prompt}`

  // Generate content using AI gateway
  const aiResponse = await generateAIContent({
    prompt,
    model: 'ollama', // Use free Ollama by default
    maxTokens: 1000,
  })

  const generatedContent = aiResponse.content || 'Content generation failed. Please try again.'

  // Save AI content request
  const aiContent = await prisma.aiContentRequest.create({
    data: {
      tenantId: validatedData.organizationId,
      contentType: validatedData.contentType,
      prompt: validatedData.prompt,
      industry: validatedData.industry,
      generatedContent,
      tone: validatedData.tone,
      includesCallToAction: validatedData.includesCallToAction,
      status: 'generated',
      usageCount: 0,
    },
  })

  const response: ApiResponse<AIContentRequest> = {
    success: true,
    statusCode: 201,
    data: {
      id: aiContent.id,
      organizationId: aiContent.tenantId,
      contentType: aiContent.contentType as AIContentRequest['contentType'],
      prompt: aiContent.prompt,
      industry: aiContent.industry,
      generatedContent: aiContent.generatedContent,
      tone: aiContent.tone as AIContentRequest['tone'],
      includesCallToAction: aiContent.includesCallToAction,
      status: aiContent.status as AIContentRequest['status'],
      approvedAt: aiContent.approvedAt || undefined,
      usageCount: aiContent.usageCount || 0,
      createdAt: aiContent.createdAt,
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response, { status: 201 })
})

/**
 * List AI content requests
 * GET /api/marketing/ai-content?organizationId=xxx&contentType=email&page=1&pageSize=20
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organizationId')
  const contentType = searchParams.get('contentType')
  const page = parseInt(searchParams.get('page') || '1', 10)
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

  if (!organizationId) {
    return NextResponse.json(
      {
        success: false,
        statusCode: 400,
        error: {
          code: 'MISSING_ORGANIZATION_ID',
          message: 'organizationId is required',
        },
      },
      { status: 400 }
    )
  }

  const where: Record<string, unknown> = {
    tenantId: organizationId,
  }

  if (contentType) {
    where.contentType = contentType
  }

  const [contentRequests, total] = await Promise.all([
    prisma.aiContentRequest.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aiContentRequest.count({ where }),
  ])

  const formattedContent: AIContentRequest[] = contentRequests.map((content) => ({
    id: content.id,
    organizationId: content.tenantId,
    contentType: content.contentType as AIContentRequest['contentType'],
    prompt: content.prompt,
    industry: content.industry,
    generatedContent: content.generatedContent,
    tone: content.tone as AIContentRequest['tone'],
    includesCallToAction: content.includesCallToAction,
    status: content.status as AIContentRequest['status'],
    approvedAt: content.approvedAt || undefined,
    usageCount: content.usageCount || 0,
    createdAt: content.createdAt,
  }))

  const response: ApiResponse<{
    content: AIContentRequest[]
    total: number
    page: number
    pageSize: number
  }> = {
    success: true,
    statusCode: 200,
    data: {
      content: formattedContent,
      total,
      page,
      pageSize,
    },
    meta: {
      pagination: {
        page,
        pageSize,
        total,
      },
      timestamp: new Date().toISOString(),
    },
  }

  return NextResponse.json(response)
})
