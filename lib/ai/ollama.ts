/**
 * Ollama LLM Integration
 * Primary AI service for PayAid V3
 * Falls back to OpenAI if Ollama is unavailable
 */

interface OllamaConfig {
  baseUrl: string
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

class OllamaClient {
  private config: OllamaConfig

  constructor() {
    const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL || 'mistral:7b'
    const apiKey = process.env.OLLAMA_API_KEY || null
    
    console.log('🔧 OllamaClient initialized:', {
      baseUrl,
      model,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
    })
    
    this.config = {
      baseUrl,
      model,
    }
  }

  private getApiKey(): string | null {
    return process.env.OLLAMA_API_KEY || null
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      // Add API key if provided (for cloud Ollama services)
      const apiKey = this.getApiKey()
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const requestBody = {
        model: this.config.model,
        messages,
        stream: false,
      }
      
      console.log('📤 Ollama request:', {
        url: `${this.config.baseUrl}/api/chat`,
        model: this.config.model,
        messageCount: messages.length,
        hasApiKey: !!apiKey,
      })

      const response = await fetch(`${this.config.baseUrl}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.error('❌ Ollama API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(`Ollama API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      console.log('📥 Ollama response structure:', {
        hasMessage: !!data.message,
        hasResponse: !!data.response,
        hasContent: !!data.content,
        keys: Object.keys(data),
      })
      
      // Handle different Ollama response formats
      let message = ''
      if (data.message?.content) {
        message = data.message.content
      } else if (data.response) {
        message = data.response
      } else if (typeof data === 'string') {
        message = data
      } else if (data.content) {
        message = data.content
      }
      
      if (!message || message.trim() === '') {
        throw new Error('Ollama returned empty response')
      }
      
      return {
        message: message || '',
        usage: data.usage,
      }
    } catch (error) {
      console.error('Ollama chat error:', error)
      // Don't fallback automatically - let the API route handle fallbacks
      // This ensures business context is preserved
      throw error
    }
  }

  private async fallbackToGroq(messages: ChatMessage[]): Promise<ChatResponse> {
    const { getGroqClient } = await import('./groq')
    const groq = getGroqClient()
    return await groq.chat(messages)
  }

  private async fallbackToOpenAI(messages: ChatMessage[]): Promise<ChatResponse> {
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!openaiApiKey) {
      throw new Error('Ollama unavailable and OpenAI API key not configured')
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
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
      console.error('OpenAI fallback error:', error)
      throw new Error('AI service unavailable')
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

    try {
      const response = await this.chat(messages)
      return response.message
    } catch (error) {
      // Try Groq fallback
      try {
        const { getGroqClient } = await import('./groq')
        const groq = getGroqClient()
        const groqResponse = await groq.chat(messages)
        return groqResponse.message
      } catch (groqError) {
        // Final fallback to rule-based
        return this.generateRuleBasedResponse(prompt)
      }
    }
  }

  private fallbackToRuleBased(messages: ChatMessage[]): ChatResponse {
    const userMessage = messages.find(m => m.role === 'user')?.content || ''
    const response = this.generateRuleBasedResponse(userMessage)
    
    return {
      message: response,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    }
  }

  private generateRuleBasedResponse(query: string): string {
    const lowerQuery = query.toLowerCase()
    
    // Invoice-related queries
    if (lowerQuery.includes('invoice') || lowerQuery.includes('overdue')) {
      return `To check overdue invoices, go to the Invoices page and filter by "Overdue" status. You can also view them on the Dashboard under the Alerts section. Overdue invoices are those that have passed their due date and haven't been paid yet.`
    }
    
    // Task-related queries
    if (lowerQuery.includes('task') || lowerQuery.includes('todo')) {
      return `To view tasks that need attention, go to the Tasks page. You can filter by status (pending, in_progress) or priority (high, medium, low). Tasks with high priority or approaching due dates should be addressed first.`
    }
    
    // Deal-related queries
    if (lowerQuery.includes('deal') || lowerQuery.includes('pipeline')) {
      return `To view your deals pipeline, go to the Deals page. You'll see a Kanban board with different stages. Deals in "Negotiation" or "Proposal" stages typically need the most attention.`
    }
    
    // Revenue-related queries
    if (lowerQuery.includes('revenue') || lowerQuery.includes('income') || lowerQuery.includes('sales')) {
      return `You can view revenue information on the Dashboard. It shows your total revenue for the last 30 days. For detailed financial reports, go to Accounting > Reports to see Profit & Loss statements and revenue breakdowns.`
    }
    
    // Contact-related queries
    if (lowerQuery.includes('contact') || lowerQuery.includes('customer') || lowerQuery.includes('client')) {
      return `To manage contacts, go to the Contacts page. You can view all customers, leads, and vendors. Use the filters to find specific contacts or search by name, email, or company.`
    }
    
    // Product-related queries
    if (lowerQuery.includes('product') || lowerQuery.includes('inventory') || lowerQuery.includes('stock')) {
      return `To manage products, go to the Products page. You can view your product catalog, check stock levels, and manage pricing. Products with low stock will be highlighted.`
    }
    
    // Order-related queries
    if (lowerQuery.includes('order')) {
      return `To view orders, go to the Orders page. You can see all customer orders, their status (pending, confirmed, shipped, delivered), and track order details.`
    }
    
    // General help
    if (lowerQuery.includes('help') || lowerQuery.includes('how')) {
      return `I can help you with:
- Checking overdue invoices
- Viewing pending tasks
- Understanding your deals pipeline
- Revenue and financial insights
- Managing contacts, products, and orders

Try asking specific questions like "What invoices are overdue?" or "Show me my top deals".`
    }
    
    // Default response
    return `I understand you're asking about: "${query}". 

For the best experience, please configure an AI service (Ollama or OpenAI) in your environment variables. 

In the meantime, you can:
- Check the Dashboard for overview statistics
- Use the navigation menu to access specific modules
- View detailed information in each section

For specific queries:
- Invoices: Go to Invoices page
- Tasks: Go to Tasks page  
- Deals: Go to Deals page
- Revenue: Check Dashboard or Accounting > Reports`
  }
}

// Singleton instance
let ollamaClientInstance: OllamaClient | null = null

export function getOllamaClient(): OllamaClient {
  if (!ollamaClientInstance) {
    ollamaClientInstance = new OllamaClient()
  }
  return ollamaClientInstance
}

export default getOllamaClient()

