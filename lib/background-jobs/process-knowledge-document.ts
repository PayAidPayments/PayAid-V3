/**
 * Background Job: Process Knowledge Document
 * 
 * Processes uploaded documents:
 * 1. Extract text from PDF/DOCX/TXT/MD
 * 2. Chunk text into segments
 * 3. Generate embeddings for chunks
 * 4. Store chunks and embeddings in database
 * 5. Mark document as indexed
 */

import { prisma } from '@/lib/db/prisma'
import { SimpleDocumentProcessor, generateEmbedding } from '@/lib/knowledge/document-processor'

export interface ProcessDocumentJobData {
  documentId: string
  tenantId: string
}

/**
 * Process document processing job
 */
export async function processKnowledgeDocument(jobData: ProcessDocumentJobData) {
  const { documentId, tenantId } = jobData

  try {
    console.log(`Processing document ${documentId} for tenant ${tenantId}`)

    // Get document
    const document = await prisma.knowledgeDocument.findFirst({
      where: {
        id: documentId,
        tenantId,
      },
    })

    if (!document) {
      throw new Error(`Document ${documentId} not found`)
    }

    // If already indexed, skip
    if (document.isIndexed) {
      console.log(`Document ${documentId} already indexed, skipping`)
      return { success: true, message: 'Already indexed' }
    }

    // Extract text if not already provided
    let text = document.extractedText

    if (!text) {
      console.log(`Extracting text from ${document.fileType} file...`)
      const processor = new SimpleDocumentProcessor()
      text = await processor.extractText(document.fileUrl, document.fileType)
      
      // Update document with extracted text
      await prisma.knowledgeDocument.update({
        where: { id: documentId },
        data: { extractedText: text },
      })
    }

    if (!text || text.trim().length === 0) {
      throw new Error('No text extracted from document')
    }

    // Chunk text
    console.log(`Chunking text into segments...`)
    const processor = new SimpleDocumentProcessor()
    const chunks = await processor.chunkText(text, 1000, 200)

    if (chunks.length === 0) {
      throw new Error('No chunks created from text')
    }

    // Process chunks and create embeddings
    console.log(`Processing ${chunks.length} chunks...`)
    const chunkPromises = chunks.map(async (chunkText, index) => {
      try {
        // Generate embedding
        const embedding = await generateEmbedding(chunkText)

        // Create chunk in database
        return prisma.knowledgeDocumentChunk.create({
          data: {
            documentId,
            chunkIndex: index,
            content: chunkText,
            embedding: embedding.length > 0 ? embedding : undefined, // Store embedding if available
            metadata: {
              chunkSize: chunkText.length,
              hasEmbedding: embedding.length > 0,
            },
          },
        })
      } catch (error) {
        console.error(`Error processing chunk ${index}:`, error)
        // Continue with other chunks even if one fails
        return null
      }
    })

    const results = await Promise.all(chunkPromises)
    const successfulChunks = results.filter(Boolean).length

    // Mark document as indexed
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        isIndexed: true,
        indexedAt: new Date(),
      },
    })

    console.log(`Document ${documentId} processed successfully. Created ${successfulChunks}/${chunks.length} chunks.`)

    return {
      success: true,
      chunksCreated: successfulChunks,
      totalChunks: chunks.length,
      message: `Document processed successfully. Created ${successfulChunks} chunks.`,
    }
  } catch (error) {
    console.error(`Error processing document ${documentId}:`, error)
    
    // Update document with error status
    await prisma.knowledgeDocument.update({
      where: { id: documentId },
      data: {
        isIndexed: false,
      },
    })

    throw error
  }
}

