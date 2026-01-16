/**
 * Knowledge Base API
 * POST /api/v1/voice-agents/[id]/knowledge-base - Upload documents
 * GET /api/v1/voice-agents/[id]/knowledge-base - List documents
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { authenticateRequest } from '@/lib/middleware/auth'
import { addToKnowledgeBase, searchKnowledgeBase } from '@/lib/voice-agent'
import { z } from 'zod'

const uploadDocumentsSchema = z.object({
  documents: z.array(z.object({
    content: z.string().min(1),
    metadata: z.record(z.any()).optional(),
  })),
})

// POST /api/v1/voice-agents/[id]/knowledge-base - Upload documents
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify agent exists
    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const body = await request.json()
    const validated = uploadDocumentsSchema.parse(body)

    // Add to knowledge base
    const result = await addToKnowledgeBase(params.id, validated.documents)

    // Update agent knowledge base flag
    await prisma.voiceAgent.update({
      where: { id: params.id },
      data: {
        knowledgeBase: {
          enabled: true,
          documentCount: validated.documents.length,
          lastUpdated: new Date().toISOString(),
        },
      },
    })

    return NextResponse.json({
      success: true,
      indexed: result.count,
      message: `Successfully indexed ${result.count} documents`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[KnowledgeBase] Upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload documents' },
      { status: 500 }
    )
  }
}

// GET /api/v1/voice-agents/[id]/knowledge-base - Search knowledge base
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify agent exists
    const agent = await prisma.voiceAgent.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId,
      },
    })

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const topK = parseInt(searchParams.get('topK') || '3')

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter required' },
        { status: 400 }
      )
    }

    // Search knowledge base
    const results = await searchKnowledgeBase(params.id, query, topK)

    return NextResponse.json({
      query,
      results,
      count: results.length,
    })
  } catch (error) {
    console.error('[KnowledgeBase] Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search knowledge base' },
      { status: 500 }
    )
  }
}

