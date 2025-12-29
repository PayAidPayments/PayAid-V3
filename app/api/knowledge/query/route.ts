import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'
import { z } from 'zod'

const querySchema = z.object({
  query: z.string().min(1),
  documentId: z.string().optional(),
  limit: z.number().default(5),
})

// POST /api/knowledge/query - Query knowledge base with RAG
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = querySchema.parse(body)

    // Step 1: Get relevant document chunks (simple text search for now)
    // TODO: Implement vector similarity search when embeddings are ready
    const where: any = {
      document: {
        tenantId,
        isIndexed: true, // Only search indexed documents
      },
    }

    if (validated.documentId) {
      where.documentId = validated.documentId
    }

    // Simple text search in chunks
    const chunks = await prisma.knowledgeDocumentChunk.findMany({
      where: {
        ...where,
        content: {
          contains: validated.query,
          mode: 'insensitive',
        },
      },
      take: validated.limit,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (chunks.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find relevant information in your knowledge base. Please try rephrasing your question or upload more documents.",
        sources: [],
        confidence: 0,
      })
    }

    // Step 2: Build context from chunks
    const context = chunks
      .map((chunk, idx) => `[Source ${idx + 1} from "${chunk.document.title}"]\n${chunk.content}`)
      .join('\n\n---\n\n')

    // Step 3: Generate answer using AI
    const systemPrompt = `You are a helpful assistant that answers questions based on provided documents. 
Use only the information from the provided sources. If the answer is not in the sources, say so.
Always cite which source you used (e.g., "According to Source 1...").`

    const userPrompt = `Question: ${validated.query}\n\nContext from documents:\n${context}\n\nAnswer the question based on the context above. Cite your sources.`

    // Try AI providers in order: Groq -> Ollama -> Hugging Face
    let answer = ''
    let modelUsed = 'none'
    let tokensUsed = 0

    try {
      const groq = getGroqClient()
      const response = await groq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
      answer = response.content || ''
      modelUsed = 'groq-llama-3.1-70b'
      tokensUsed = response.totalTokens || 0
    } catch (groqError) {
      console.error('Groq error, trying Ollama:', groqError)
      try {
        const ollama = getOllamaClient()
        const response = await ollama.chat({
          model: 'llama3.1',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        })
        answer = response.message.content
        modelUsed = 'ollama-llama3.1'
      } catch (ollamaError) {
        console.error('Ollama error, trying Hugging Face:', ollamaError)
        // Fallback to Hugging Face or return error
        answer = "I'm having trouble processing your question right now. Please try again later."
        modelUsed = 'error'
      }
    }

    // Step 4: Format sources with citations
    const sources = chunks.map((chunk, idx) => ({
      index: idx + 1,
      documentId: chunk.document.id,
      documentTitle: chunk.document.title,
      documentCategory: chunk.document.category,
      chunkId: chunk.id,
      content: chunk.content.substring(0, 200) + '...', // Preview
      relevance: 1.0, // TODO: Calculate relevance score
    }))

    // Step 5: Save query to audit trail
    await prisma.knowledgeQuery.create({
      data: {
        tenantId,
        documentId: validated.documentId || null,
        query: validated.query,
        answer,
        sources: sources as any,
        confidence: 0.8, // TODO: Calculate actual confidence
        askedBy: userId,
        modelUsed,
        tokensUsed,
      },
    })

    return NextResponse.json({
      answer,
      sources,
      confidence: 0.8,
      modelUsed,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Knowledge query error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to query knowledge base' },
      { status: 500 }
    )
  }
}

