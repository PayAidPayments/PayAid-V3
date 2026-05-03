/**
 * LLM Service for Voice Agents
 * Voice uses Groq only (no Ollama) for low-latency replies.
 */

import { getGroqClient } from '@/lib/ai/groq'

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY?.trim()
}

export interface GenerateVoiceResponseOptions {
  /** Lower = faster reply (e.g. 512 for voice). Default 2048. */
  maxTokens?: number
}

/**
 * Generate voice response using LLM.
 * Prefers Groq (free tier, fast); falls back to Ollama only if Groq is not configured.
 */
export async function generateVoiceResponse(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  language: string = 'en',
  options?: GenerateVoiceResponseOptions
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
      const response = await groq.chat(messages, {
        maxTokens: options?.maxTokens ?? 2048,
      })
      return response.message || ''
    } catch (error) {
      console.error('[LLM] Groq error:', error)
      throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Voice agents: Groq only (no Ollama) for acceptable latency
  throw new Error(
    'Voice requires GROQ_API_KEY. Set it in .env (free at https://console.groq.com/keys). Ollama is not used for voice.'
  )
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
