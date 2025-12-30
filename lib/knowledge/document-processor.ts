/**
 * Document Processing Utility
 * Handles text extraction from various document formats
 */

import { getFileUrl, extractKeyFromUrl } from '@/lib/storage/file-storage'

export interface DocumentProcessor {
  extractText(fileUrl: string, fileType: string): Promise<string>
  chunkText(text: string, chunkSize?: number, overlap?: number): Promise<string[]>
}

export class SimpleDocumentProcessor implements DocumentProcessor {
  /**
   * Extract text from document
   */
  async extractText(fileUrl: string, fileType: string): Promise<string> {
    try {
      // Get file content from storage
      const key = extractKeyFromUrl(fileUrl)
      if (!key) {
        throw new Error('Invalid file URL')
      }

      // Get signed URL for file access
      const signedUrl = await getFileUrl(key, 3600)

      // Fetch file content
      const response = await fetch(signedUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Extract text based on file type
      switch (fileType.toLowerCase()) {
        case 'pdf':
          return await this.extractTextFromPDF(buffer)
        case 'docx':
          return await this.extractTextFromDOCX(buffer)
        case 'txt':
        case 'md':
          return buffer.toString('utf-8')
        default:
          throw new Error(`Unsupported file type: ${fileType}`)
      }
    } catch (error) {
      console.error('Text extraction error:', error)
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Extract text from PDF
   */
  private async extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse')
      const data = await pdfParse.default(buffer)
      return data.text
    } catch (error) {
      console.error('PDF extraction error:', error)
      throw new Error('Failed to extract text from PDF. Please ensure pdf-parse is installed.')
    }
  }

  /**
   * Extract text from DOCX
   */
  private async extractTextFromDOCX(buffer: Buffer): Promise<string> {
    try {
      const mammoth = await import('mammoth')
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    } catch (error) {
      console.error('DOCX extraction error:', error)
      throw new Error('Failed to extract text from DOCX. Please ensure mammoth is installed.')
    }
  }

  /**
   * Split text into chunks for RAG
   * Uses simple character-based chunking with overlap
   */
  async chunkText(
    text: string,
    chunkSize: number = 1000,
    overlap: number = 200
  ): Promise<string[]> {
    const chunks: string[] = []
    let start = 0

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      let chunk = text.substring(start, end)

      // Try to break at sentence boundaries
      if (end < text.length) {
        const lastPeriod = chunk.lastIndexOf('.')
        const lastNewline = chunk.lastIndexOf('\n')
        const breakPoint = Math.max(lastPeriod, lastNewline)
        
        if (breakPoint > chunkSize * 0.5) {
          chunk = chunk.substring(0, breakPoint + 1)
          start += breakPoint + 1
        } else {
          start = end - overlap
        }
      } else {
        start = end
      }

      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim())
      }
    }

    return chunks
  }
}

/**
 * Generate embeddings for text chunks
 * Uses Hugging Face inference API or OpenAI
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Try Hugging Face first (free)
    if (process.env.HUGGINGFACE_API_KEY) {
      return await generateEmbeddingHuggingFace(text)
    }

    // Fallback to OpenAI if available
    if (process.env.OPENAI_API_KEY) {
      return await generateEmbeddingOpenAI(text)
    }

    // If no embedding service available, return empty array
    // Vector search will fall back to text matching
    console.warn('No embedding service configured. Using text matching instead.')
    return []
  } catch (error) {
    console.error('Embedding generation error:', error)
    return []
  }
}

/**
 * Generate embedding using Hugging Face
 */
async function generateEmbeddingHuggingFace(text: string): Promise<number[]> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    )

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.statusText}`)
    }

    const data = await response.json()
    // Handle both single and batch responses
    return Array.isArray(data[0]) ? data[0] : data
  } catch (error) {
    console.error('Hugging Face embedding error:', error)
    throw error
  }
}

/**
 * Generate embedding using OpenAI
 */
async function generateEmbeddingOpenAI(text: string): Promise<number[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    console.error('OpenAI embedding error:', error)
    throw error
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}
