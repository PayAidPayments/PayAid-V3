/**
 * Groq AI Integration
 * Fast inference API for PayAid V3
 * Alternative to Ollama/OpenAI
 */

interface GroqConfig {
  apiKey: string
  model: string
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  message: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

class GroqClient {
  private config: GroqConfig

  constructor() {
    // Trim whitespace from API key (common issue when copying/pasting)
    const apiKey = (process.env.GROQ_API_KEY || '').trim()
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'

    this.config = {
      apiKey,
      model,
    }
  }

  async chat(messages: ChatMessage[], options?: { maxTokens?: number; signal?: AbortSignal }): Promise<ChatResponse> {
    if (!this.config.apiKey || this.config.apiKey.trim() === '') {
      const errorMsg = 'Groq API key not configured - set GROQ_API_KEY in .env file (or Vercel environment variables for production)'
      console.error('❌', errorMsg)
      throw new Error(errorMsg)
    }

    // Validate API key format (Groq keys typically start with 'gsk_')
    if (!this.config.apiKey.startsWith('gsk_')) {
      console.warn('⚠️ Groq API key format may be incorrect. Expected format: gsk_...')
    }

    try {
      const requestBody = {
        model: this.config.model,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        temperature: 0.3,
        max_tokens: options?.maxTokens ?? 2048,
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: options?.signal,
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        console.error('❌ Groq API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorData.error?.message || errorData.error || errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      
      return {
        message: data.choices[0]?.message?.content || '',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      console.error('Groq chat error:', error)
      throw error
    }
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: ChatMessage[] = []
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      })
    }
    
    messages.push({
      role: 'user',
      content: prompt,
    })

    const response = await this.chat(messages)
    return response.message
  }
}

// Singleton instance
let groqClientInstance: GroqClient | null = null

export function getGroqClient(): GroqClient {
  if (!groqClientInstance) {
    groqClientInstance = new GroqClient()
  }
  return groqClientInstance
}

export default getGroqClient
