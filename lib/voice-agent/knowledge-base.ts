/**
 * Knowledge Base Service
 * Uses Chroma vector database for RAG (Retrieval Augmented Generation)
 */

interface KnowledgeBaseDocument {
  id: string
  content: string
  metadata?: Record<string, any>
  score?: number
}

const CHROMA_URL = process.env.CHROMA_URL || 'http://localhost:8001'

/**
 * Search knowledge base for relevant documents
 */
export async function searchKnowledgeBase(
  agentId: string,
  query: string,
  topK: number = 3
): Promise<KnowledgeBaseDocument[]> {
  try {
    // Get collection for this agent
    const collectionName = `agent-${agentId}`

    // Generate embedding for query
    const { generateEmbedding } = await import('./llm')
    const queryEmbedding = await generateEmbedding(query)

    if (!queryEmbedding || queryEmbedding.length === 0) {
      console.warn('[KnowledgeBase] Empty embedding, skipping search')
      return []
    }

    // Query Chroma (using v2 API)
    const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query_embeddings: [queryEmbedding],
        n_results: topK,
      }),
    }).catch(async () => {
      // Fallback to v2 API if v1 fails
      return fetch(`${CHROMA_URL}/api/v1/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection_name: collectionName,
          query_embeddings: [queryEmbedding],
          n_results: topK,
        }),
      })
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Collection doesn't exist yet - that's okay
        console.log(`[KnowledgeBase] Collection ${collectionName} not found - will be created on first upload`)
        return []
      }
      throw new Error(`Chroma query failed: ${response.statusText}`)
    }

    const data = await response.json()

    // Format results
    const documents: KnowledgeBaseDocument[] = []
    if (data.ids && data.ids[0]) {
      for (let i = 0; i < data.ids[0].length; i++) {
        documents.push({
          id: data.ids[0][i],
          content: data.documents[0][i] || '',
          metadata: data.metadatas[0][i] || {},
          score: data.distances?.[0]?.[i] ? 1 - data.distances[0][i] : undefined,
        })
      }
    }

    return documents
  } catch (error) {
    console.error('[KnowledgeBase] Error searching:', error)
    // Return empty array on error (don't break the call)
    return []
  }
}

/**
 * Add documents to knowledge base
 */
export async function addToKnowledgeBase(
  agentId: string,
  documents: Array<{ id?: string; content: string; metadata?: Record<string, any> }>
): Promise<{ success: boolean; count: number }> {
  try {
    const collectionName = `agent-${agentId}`

    // Ensure collection exists
    await ensureCollection(collectionName)

    // Generate embeddings for all documents
    const { generateEmbedding } = await import('./llm')
    const embeddings = await Promise.all(
      documents.map((doc) => generateEmbedding(doc.content))
    )

    // Prepare data
    const ids = documents.map((doc, i) => doc.id || `doc-${Date.now()}-${i}`)
    const contents = documents.map((doc) => doc.content)
    const metadatas = documents.map((doc) => ({
      ...doc.metadata,
      agent_id: agentId,
      created_at: new Date().toISOString(),
    }))

    // Add to Chroma (using v1 API, with v2 fallback)
    const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: ids,
        embeddings: embeddings,
        documents: contents,
        metadatas: metadatas,
      }),
    }).catch(async () => {
      // Fallback to v2 API if v1 fails
      return fetch(`${CHROMA_URL}/api/v1/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          collection_name: collectionName,
          ids: ids,
          embeddings: embeddings,
          documents: contents,
          metadatas: metadatas,
        }),
      })
    })

    if (!response.ok) {
      throw new Error(`Chroma add failed: ${response.statusText}`)
    }

    return { success: true, count: documents.length }
  } catch (error) {
    console.error('[KnowledgeBase] Error adding documents:', error)
    throw error
  }
}

/**
 * Ensure collection exists in Chroma
 */
async function ensureCollection(collectionName: string): Promise<void> {
  try {
    // Check if collection exists (try v1 first, then v2)
    let checkResponse = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}`).catch(() => null)
    
    if (!checkResponse || checkResponse.status === 404) {
      // Try v2 API
      checkResponse = await fetch(`${CHROMA_URL}/api/v1/collections`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => null)
      
      const collections = checkResponse?.ok ? await checkResponse.json() : []
      const exists = Array.isArray(collections) && collections.some((c: any) => c.name === collectionName || c.id === collectionName)
      
      if (!exists) {
        // Create collection (try v1, then v2)
        let createResponse = await fetch(`${CHROMA_URL}/api/v1/collections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: collectionName,
            metadata: {},
          }),
        }).catch(() => null)
        
        if (!createResponse || !createResponse.ok) {
          // Try v2 API
          createResponse = await fetch(`${CHROMA_URL}/api/v1/collections`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: collectionName,
              metadata: {},
            }),
          })
        }

        if (!createResponse || !createResponse.ok) {
          throw new Error(`Failed to create collection: ${createResponse?.statusText || 'Unknown error'}`)
        }
      }
    }
  } catch (error) {
    console.error('[KnowledgeBase] Error ensuring collection:', error)
    throw error
  }
}

/**
 * Delete documents from knowledge base
 */
export async function deleteFromKnowledgeBase(
  agentId: string,
  documentIds: string[]
): Promise<{ success: boolean }> {
  try {
    const collectionName = `agent-${agentId}`

    const response = await fetch(`${CHROMA_URL}/api/v1/collections/${collectionName}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: documentIds,
      }),
    })

    if (!response.ok) {
      throw new Error(`Chroma delete failed: ${response.statusText}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[KnowledgeBase] Error deleting documents:', error)
    throw error
  }
}

