/**
 * Vector Search Utility
 * 
 * Implements vector similarity search for Knowledge Base
 * Uses cosine similarity to find relevant document chunks
 */

import { prisma } from '@/lib/db/prisma'
import { generateEmbedding, cosineSimilarity } from './document-processor'

export interface SearchResult {
  chunk: any
  similarity: number
  relevance: number
}

/**
 * Search for relevant chunks using vector similarity
 */
export async function vectorSearch(
  query: string,
  tenantId: string,
  documentId?: string,
  limit: number = 5,
  minSimilarity: number = 0.3
): Promise<SearchResult[]> {
  try {
    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query)

    // If no embedding generated, fall back to text search
    if (queryEmbedding.length === 0) {
      return []
    }

    // Build where clause
    const where: any = {
      document: {
        tenantId,
        isIndexed: true,
      },
      embedding: {
        not: null, // Only chunks with embeddings
      },
    }

    if (documentId) {
      where.documentId = documentId
    }

    // Get all chunks with embeddings
    const chunks = await prisma.knowledgeDocumentChunk.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
    })

    if (chunks.length === 0) {
      return []
    }

    // Calculate similarity for each chunk
    const results: SearchResult[] = []

    for (const chunk of chunks) {
      if (!chunk.embedding) continue

      // Parse embedding from JSON
      const chunkEmbedding = Array.isArray(chunk.embedding)
        ? chunk.embedding
        : JSON.parse(chunk.embedding as string)

      if (!Array.isArray(chunkEmbedding) || chunkEmbedding.length === 0) {
        continue
      }

      // Calculate cosine similarity
      const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding)

      // Filter by minimum similarity
      if (similarity >= minSimilarity) {
        // Calculate relevance score (0-1)
        // Higher similarity = higher relevance
        // Normalize to 0-1 range (assuming similarity is already 0-1)
        const relevance = Math.max(0, Math.min(1, similarity))

        results.push({
          chunk,
          similarity,
          relevance,
        })
      }
    }

    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity)

    // Return top N results
    return results.slice(0, limit)
  } catch (error) {
    console.error('Vector search error:', error)
    return []
  }
}

/**
 * Hybrid search: Vector similarity + text search
 * Falls back to text search if vector search fails or returns no results
 */
export async function hybridSearch(
  query: string,
  tenantId: string,
  documentId?: string,
  limit: number = 5
): Promise<SearchResult[]> {
  // Try vector search first
  const vectorResults = await vectorSearch(query, tenantId, documentId, limit)

  // If vector search returns results, use them
  if (vectorResults.length > 0) {
    return vectorResults
  }

  // Fall back to text search
  const where: any = {
    document: {
      tenantId,
      isIndexed: true,
    },
    content: {
      contains: query,
      mode: 'insensitive',
    },
  }

  if (documentId) {
    where.documentId = documentId
  }

  const textChunks = await prisma.knowledgeDocumentChunk.findMany({
    where,
    take: limit,
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

  // Convert to SearchResult format with default relevance
  return textChunks.map((chunk) => ({
    chunk,
    similarity: 0.5, // Default similarity for text search
    relevance: 0.5, // Default relevance for text search
  }))
}

/**
 * Calculate confidence score based on search results
 */
export function calculateConfidence(results: SearchResult[]): number {
  if (results.length === 0) {
    return 0
  }

  // Average similarity of top results
  const avgSimilarity = results.reduce((sum, r) => sum + r.similarity, 0) / results.length

  // Boost confidence if we have multiple high-quality results
  const highQualityResults = results.filter((r) => r.similarity > 0.7).length
  const qualityBoost = Math.min(0.2, highQualityResults * 0.05)

  // Confidence is based on average similarity + quality boost
  const confidence = Math.min(1, avgSimilarity + qualityBoost)

  return confidence
}

