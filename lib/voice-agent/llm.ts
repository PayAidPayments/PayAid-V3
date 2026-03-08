/**
 * LLM Service for Voice Agents
 * Uses Groq (primary, no local RAM) or Ollama (fallback when Groq not configured).
 */

import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY?.trim()
}

/**
 * Generate voice response using LLM.
 * Prefers Groq (reliable, no memory issues); falls back to Ollama only if Groq is not configured.
 */
export async function generateVoiceResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  language: string = 'en'
): Promise<string> {
  const messages: ConversationMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    })),
  ]

  if (isGroqConfigured()) {
    try {
      const groq = getGroqClient()
      const response = await groq.chat(messages)
      return response.message || ''
    } catch (error) {
      console.error('[LLM] Groq error:', error)
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  try {
    const ollama = getOllamaClient()
    const ollamaMessages = messages.map((msg) => ({ role: msg.role, content: msg.content }))
    const response = await ollama.chat(ollamaMessages)
    return response.message || ''
  } catch (error) {
    console.error('[LLM] Ollama error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.includes('model requires more system memory') || msg.includes('memory')) {
      throw new Error(
        'Ollama ran out of memory. Set GROQ_API_KEY in .env to use Groq instead (recommended), or use a smaller model: OLLAMA_MODEL=tinyllama'
      )
    }
    throw new Error(`LLM generation failed: ${msg}`)
  }
}

/**
 * Generate embedding for text (for knowledge base).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    if (isGroqConfigured()) {
      return []
    }
    const response = await fetch(`${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        prompt: text,
      }),
    })
    if (!response.ok) throw new Error('Embedding generation failed')
    const data = await response.json()
    return data.embedding || []
  } catch (error) {
    console.error('[LLM] Error generating embedding:', error)
    return []
  }
}
