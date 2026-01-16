/**
 * Free LLM Service
 * Uses Ollama (already integrated)
 * 
 * This is a free alternative to OpenAI
 */

import { getOllamaClient } from '@/lib/ai/ollama'

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * Generate voice response using Ollama (FREE)
 * Streaming support for real-time responses
 */
export async function generateVoiceResponseFree(
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

    // Use Ollama client (already integrated)
    const ollama = getOllamaClient()
    
    // Generate response
    const response = await ollama.chat(messages)

    return response.message || ''
  } catch (error) {
    console.error('[LLM Free] Error generating response:', error)
    throw new Error(`LLM generation failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Generate streaming response using Ollama
 * Returns async generator for real-time streaming
 */
export async function* generateVoiceResponseStream(
  systemPrompt: string,
  conversationHistory: Array<{ role: string; content: string }>,
  language: string = 'en'
): AsyncGenerator<string, void, unknown> {
  try {
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

    // Use Ollama streaming API
    const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL || 'mistral:7b'

    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Failed to get response stream')
    }

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            if (data.message?.content) {
              yield data.message.content
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('[LLM Free] Error in streaming:', error)
    throw error
  }
}
