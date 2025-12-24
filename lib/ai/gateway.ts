/**
 * AI Gateway Client
 * Communicates with the self-hosted AI services gateway
 */

const GATEWAY_URL = process.env.AI_GATEWAY_URL || process.env.NEXT_PUBLIC_AI_GATEWAY_URL || 'http://localhost:8000'

export interface TextToImageRequest {
  prompt: string
  style?: string
  size?: string
  num_inference_steps?: number
  guidance_scale?: number
}

export interface TextToSpeechRequest {
  text: string
  language?: string
  voice?: string
  speed?: number
}

export interface SpeechToTextRequest {
  audio_url: string
  language?: string
  task?: 'transcribe' | 'translate'
}

export interface ImageToImageRequest {
  image_url: string
  prompt: string
  strength?: number
  num_inference_steps?: number
}

export interface ImageToTextRequest {
  image_url: string
  task?: 'caption' | 'ocr' | 'both'
}

export class AIGatewayClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string = GATEWAY_URL) {
    this.baseUrl = baseUrl
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async textToImage(request: TextToImageRequest) {
    return this.request<{ image_url: string; revised_prompt?: string; service: string }>(
      '/api/text-to-image',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async textToSpeech(request: TextToSpeechRequest) {
    return this.request<{ audio_url: string; duration?: number; service: string }>(
      '/api/text-to-speech',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async speechToText(request: SpeechToTextRequest) {
    return this.request<{ text: string; language?: string; segments?: any[]; service: string }>(
      '/api/speech-to-text',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async imageToImage(request: ImageToImageRequest) {
    return this.request<{ image_url: string; service: string }>(
      '/api/image-to-image',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async imageToText(request: ImageToTextRequest) {
    return this.request<{ caption?: string; ocr_text?: string; service: string }>(
      '/api/image-to-text',
      {
        method: 'POST',
        body: JSON.stringify(request),
      }
    )
  }

  async getUsage() {
    return this.request<{ usage: Record<string, number>; total: number; month: string }>(
      '/api/usage',
      {
        method: 'GET',
      }
    )
  }

  async healthCheck() {
    return this.request<{ status: string; services: Record<string, any>; timestamp: string }>(
      '/health',
      {
        method: 'GET',
      }
    )
  }
}

export const aiGateway = new AIGatewayClient()
