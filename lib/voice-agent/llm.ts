/**
 * LLM Service for Voice Agents
 * Uses Ollama (local) for generating responses
 */

import { getOllamaClient } from '@/lib/ai/ollama'

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Generate voice response using LLM
 */
export async function generateVoiceResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  language: string = 'en'
): Promise<string> {
  try {
    // Build messages array
    const messages: ConversationMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
    ]

    // Use Ollama client
    const ollama = getOllamaClient()
    
    // Convert messages to Ollama format
    const ollamaMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }))

    const response = await ollama.chat(ollamaMessages)

    return response.message || ''
  } catch (error) {
    console.error('[LLM] Error generating response:', error)
    throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generate embedding for text (for knowledge base)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use Ollama to generate embeddings
    // Note: This is a placeholder - you may need to use a dedicated embedding model
    const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt: text,
      }),
    })

    if (!response.ok) {
      throw new Error('Embedding generation failed')
    }

    const data = await response.json()
    return data.embedding || []
  } catch (error) {
    console.error('[LLM] Error generating embedding:', error)
    // Return empty array as fallback
    return []
  }
}

