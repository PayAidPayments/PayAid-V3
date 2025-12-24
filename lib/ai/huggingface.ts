/**
 * Hugging Face Inference API Integration
 * Cloud-based API for accessing thousands of open-source models
 * Alternative to self-hosted Hugging Face (Docker)
 */

interface HuggingFaceConfig {
  apiKey: string
  model: string
  imageModel?: string
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

class HuggingFaceClient {
  private config: HuggingFaceConfig
  private baseUrl = 'https://router.huggingface.co' // Router endpoint for chat (replaces api-inference.huggingface.co)
  private inferenceBaseUrl = 'https://router.huggingface.co/hf-inference' // Router endpoint for inference tasks (image generation)

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY || ''
    // Popular models for chat (router endpoint):
    // - google/gemma-2-2b-it (recommended - free tier)
    // - Qwen/Qwen2.5-7B-Instruct-1M
    // - mistralai/Mistral-7B-Instruct-v0.2:hf-inference (with provider)
    // Note: Router endpoint may require provider specification (model:provider)
    const model = process.env.HUGGINGFACE_MODEL || 'google/gemma-2-2b-it'
    
    // Image generation models (via hf-inference endpoint):
    // - ByteDance/SDXL-Lightning (fast, good quality)
    // - black-forest-labs/FLUX.1-Krea-dev (high quality)
    // - ByteDance/Hyper-SD (high performance)
    const imageModel = process.env.HUGGINGFACE_IMAGE_MODEL || 'ByteDance/SDXL-Lightning'
    
    console.log('🔧 HuggingFaceClient initialized:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey.length,
      model,
      imageModel,
    })
    
    this.config = {
      apiKey,
      model,
      imageModel,
    }
  }

  /**
   * Convert chat messages to prompt format for Hugging Face models
   */
  private formatMessages(messages: ChatMessage[]): string {
    let prompt = ''
    
    for (const msg of messages) {
      if (msg.role === 'system') {
        prompt += `System: ${msg.content}\n\n`
      } else if (msg.role === 'user') {
        prompt += `User: ${msg.content}\n\n`
      } else if (msg.role === 'assistant') {
        prompt += `Assistant: ${msg.content}\n\n`
      }
    }
    
    prompt += 'Assistant:'
    return prompt
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    if (!this.config.apiKey) {
      throw new Error('Hugging Face API key not configured - set HUGGINGFACE_API_KEY in .env file')
    }

    try {
      // Use OpenAI-compatible chat completions format with the new router
      console.log('📤 Hugging Face request:', {
        model: this.config.model,
        messageCount: messages.length,
        baseUrl: this.baseUrl,
      })

      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          temperature: 0.7,
          max_tokens: 1024,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        
        // Handle model loading state
        if (response.status === 503 && errorData.estimated_time) {
          console.warn('⏳ Model is loading, estimated time:', errorData.estimated_time)
          throw new Error(`Model is loading, please try again in ${Math.ceil(errorData.estimated_time)} seconds`)
        }
        
        console.error('❌ Hugging Face API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        throw new Error(`Hugging Face API error: ${response.status} ${response.statusText} - ${errorData.error?.message || errorData.error || errorText.substring(0, 200)}`)
      }

      const data = await response.json()
      
      // New router uses OpenAI-compatible format
      const generatedText = data.choices?.[0]?.message?.content || ''
      
      console.log('📥 Hugging Face response:', {
        hasGeneratedText: !!generatedText,
        textLength: generatedText.length,
        hasUsage: !!data.usage,
      })
      
      return {
        message: generatedText.trim(),
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      console.error('Hugging Face chat error:', error)
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

  /**
   * Generate image from text prompt using Hugging Face Inference API
   */
  async textToImage(options: {
    prompt: string
    style?: string
    size?: string
    negative_prompt?: string
    num_inference_steps?: number
    guidance_scale?: number
  }): Promise<{
    image_url: string
    revised_prompt: string
    service: string
  }> {
    if (!this.config.apiKey) {
      throw new Error('Hugging Face API key not configured - set HUGGINGFACE_API_KEY in .env file')
    }

    try {
      // Enhance prompt with style if provided
      let enhancedPrompt = options.prompt
      if (options.style) {
        const styleMap: Record<string, string> = {
          realistic: 'photorealistic, professional photography style',
          artistic: 'artistic, creative, visually striking',
          cartoon: 'cartoon style, animated, colorful',
          minimalist: 'minimalist, clean, simple design',
          vintage: 'vintage style, retro aesthetic',
          modern: 'modern, contemporary design',
        }
        enhancedPrompt = `${options.prompt}, ${styleMap[options.style] || options.style} style`
      }

      // Parse size (default: 1024x1024)
      let width = 1024
      let height = 1024
      if (options.size) {
        const [w, h] = options.size.split('x').map(Number)
        if (w && h) {
          width = w
          height = h
        }
      }

      const model = this.config.imageModel || 'ByteDance/SDXL-Lightning'
      
      console.log('🎨 Hugging Face image generation request:', {
        model,
        promptLength: enhancedPrompt.length,
        size: `${width}x${height}`,
        endpoint: 'router.huggingface.co',
      })

      // Use router endpoint for image generation (api-inference.huggingface.co is deprecated as of 2024)
      // Router endpoint format: /hf-inference/models/{model}
      const inferenceUrl = `${this.inferenceBaseUrl}/models/${model}`
      
      // Build request body - Router endpoint format for image generation
      const parameters: any = {}
      
      // Basic parameters that most models support
      if (width && height) {
        parameters.width = width
        parameters.height = height
      }
      
      // Optional parameters (may not be supported by all models)
      if (options.negative_prompt) {
        parameters.negative_prompt = options.negative_prompt
      }
      if (options.num_inference_steps) {
        parameters.num_inference_steps = options.num_inference_steps
      }
      if (options.guidance_scale) {
        parameters.guidance_scale = options.guidance_scale
      }
      
      // Router endpoint format: { inputs: prompt, parameters: {...} }
      const requestBody: any = {
        inputs: enhancedPrompt,
      }
      
      // Only add parameters if we have any
      if (Object.keys(parameters).length > 0) {
        requestBody.parameters = parameters
      }
      
      console.log('📤 Hugging Face API request:', {
        url: inferenceUrl,
        model,
        promptLength: enhancedPrompt.length,
        hasParameters: Object.keys(parameters).length > 0,
        endpoint: 'router.huggingface.co',
      })
      
      const response = await fetch(inferenceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        let errorData: any = {}
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText, raw: errorText }
        }
        
        console.error('❌ Hugging Face API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errorText: errorText.substring(0, 500),
        })
        
        // Handle model loading state
        if (response.status === 503) {
          if (errorData.estimated_time) {
            console.warn('⏳ Image model is loading, estimated time:', errorData.estimated_time)
            throw new Error(`Model is loading, please try again in ${Math.ceil(errorData.estimated_time)} seconds`)
          } else {
            throw new Error(`Model is currently unavailable (503). This usually means the model is loading. Please try again in a few moments.`)
          }
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          throw new Error(`Authentication failed. Please check your HUGGINGFACE_API_KEY is valid and has not expired.`)
        }
        
        // Handle not found errors
        if (response.status === 404) {
          throw new Error(`Model "${model}" not found. Please check the model name is correct.`)
        }
        
        // Handle rate limiting
        if (response.status === 429) {
          throw new Error(`Rate limit exceeded. Please wait a moment and try again.`)
        }
        
        // Generic error with details
        const errorMessage = errorData.error?.message || errorData.error || errorData.raw || errorText || 'Unknown error'
        throw new Error(`Hugging Face API error (${response.status}): ${errorMessage}`)
      }

      // Hugging Face returns image as raw bytes (binary data)
      // Check content type to determine image format
      const contentType = response.headers.get('content-type') || 'image/png'
      const imageData = await response.blob()
      const arrayBuffer = await imageData.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      
      // Determine image format from content type
      const imageFormat = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpeg' : 'png'
      const imageUrl = `data:image/${imageFormat};base64,${base64}`
      
      console.log('✅ Hugging Face image generated successfully', {
        size: arrayBuffer.byteLength,
        format: imageFormat,
        contentType,
      })
      
      return {
        image_url: imageUrl,
        revised_prompt: enhancedPrompt,
        service: 'huggingface-inference',
      }
    } catch (error) {
      console.error('Hugging Face image generation error:', error)
      throw error
    }
  }
}

// Singleton instance
let huggingFaceClientInstance: HuggingFaceClient | null = null

export function getHuggingFaceClient(): HuggingFaceClient {
  if (!huggingFaceClientInstance) {
    huggingFaceClientInstance = new HuggingFaceClient()
  }
  return huggingFaceClientInstance
}

export default getHuggingFaceClient()
