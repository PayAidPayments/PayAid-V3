import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { prisma } from '@/lib/db/prisma'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'
import { hybridSearch, calculateConfidence } from '@/lib/knowledge/vector-search'
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

    // Step 1: Get relevant document chunks using hybrid search (vector + text)
    const searchResults = await hybridSearch(
      validated.query,
      tenantId,
      validated.documentId,
      validated.limit
    )

    if (searchResults.length === 0) {
      return NextResponse.json({
        answer: "I couldn't find relevant information in your knowledge base. Please try rephrasing your question or upload more documents.",
        sources: [],
        confidence: 0,
      })
    }

    // Extract chunks from search results
    const chunks = searchResults.map((result) => result.chunk)

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
      const response = await groq.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
      answer = response.message || ''
      modelUsed = 'groq-llama-3.1-70b'
      tokensUsed = response.usage?.totalTokens || 0
    } catch (groqError) {
      console.error('Groq error, trying Ollama:', groqError)
      try {
        const ollama = getOllamaClient()
        const response = await ollama.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ])
        answer = response.message
        modelUsed = 'ollama-llama3.1'
      } catch (ollamaError) {
        console.error('Ollama error, trying Hugging Face:', ollamaError)
        // Fallback to Hugging Face or return error
        answer = "I'm having trouble processing your question right now. Please try again later."
        modelUsed = 'error'
      }
    }

    // Step 4: Format sources with citations and relevance scores
    const sources = searchResults.map((result, idx) => ({
      index: idx + 1,
      documentId: result.chunk.document.id,
      documentTitle: result.chunk.document.title,
      documentCategory: result.chunk.document.category,
      chunkId: result.chunk.id,
      content: result.chunk.content.substring(0, 200) + '...', // Preview
      relevance: result.relevance, // Calculated relevance score
      similarity: result.similarity, // Similarity score
    }))

    // Step 5: Calculate confidence score
    const confidence = calculateConfidence(searchResults)

    // Step 6: Save query to audit trail
    await prisma.knowledgeQuery.create({
      data: {
        tenantId,
        documentId: validated.documentId || null,
        query: validated.query,
        answer,
        sources: sources as any,
        confidence,
        askedBy: userId,
        modelUsed,
        tokensUsed,
      },
    })

    return NextResponse.json({
      answer,
      sources,
      confidence,
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

