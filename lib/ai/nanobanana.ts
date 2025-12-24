/**
 * Google Gemini 2.5 Flash Image (Nano Banana) Integration
 * Superior image generation with editing and fusion capabilities
 * Cost: ₹3.23 per image (~$0.039 USD)
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai'

interface ImageGenerationRequest {
  prompt: string
  style?: string
  size?: string
}

interface ImageEditRequest {
  imageBuffer: Buffer
  imageMimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/heic'
  editPrompt: string
}

interface ImageFusionRequest {
  imageBuffers: Buffer[]
  imageMimeTypes: ('image/jpeg' | 'image/png' | 'image/webp' | 'image/heic')[]
  fusionPrompt: string
}

interface ImageGenerationResponse {
  image_url: string
  revised_prompt: string
  service: string
  base64?: string
  processingTimeMs?: number
  costInINR?: number
}

class NanoBananaClient {
  private client: GoogleGenerativeAI | null = null
  private model: GenerativeModel | null = null
  private apiKey: string
  private readonly MODEL_NAME = 'gemini-2.5-flash-image'
  private readonly COST_PER_IMAGE = 0.039 // USD per image
  private readonly COST_IN_INR = 3.23 // Approximate INR cost

  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ''
    
    if (!this.apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found in environment variables')
      return
    }

    if (!this.apiKey.startsWith('AIza')) {
      console.warn('⚠️ GEMINI_API_KEY has invalid format (should start with "AIza")')
      return
    }

    try {
      this.client = new GoogleGenerativeAI(this.apiKey)
      this.model = this.client.getGenerativeModel({
        model: this.MODEL_NAME,
      })
      console.log('✅ NanoBananaClient initialized')
    } catch (error) {
      console.error('❌ Failed to initialize NanoBananaClient:', error)
    }
  }

  /**
   * Check if the service is available
   */
  isAvailable(): boolean {
    return !!this.model && !!this.apiKey && this.apiKey.startsWith('AIza')
  }

  /**
   * Generate image from text prompt
   */
  async generateImage(options: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'Nano Banana service not available. GEMINI_API_KEY not configured. ' +
        'Get key at https://aistudio.google.com/app/apikey and add to .env'
      )
    }

    const startTime = Date.now()

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

      console.log('🎨 Nano Banana image generation request:', {
        promptLength: enhancedPrompt.length,
        style: options.style,
        size: options.size,
      })

      const response = await this.model!.generateContent({
        contents: [
          {
            parts: [
              {
                text: enhancedPrompt,
              },
            ],
          },
        ],
      })

      // Extract image from response
      const imageBuffer = await this.extractImageFromResponse(response)
      const base64 = imageBuffer.toString('base64')
      const imageUrl = `data:image/png;base64,${base64}`
      const processingTimeMs = Date.now() - startTime

      console.log('✅ Nano Banana image generated successfully', {
        size: imageBuffer.length,
        processingTimeMs,
        costInINR: this.COST_IN_INR,
      })

      return {
        image_url: imageUrl,
        revised_prompt: enhancedPrompt,
        service: 'nano-banana',
        base64,
        processingTimeMs,
        costInINR: this.COST_IN_INR,
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime
      console.error('❌ Nano Banana image generation error:', error)
      
      if (error instanceof Error) {
        // Handle specific Google API errors
        if (error.message.includes('API_KEY_INVALID') || error.message.includes('API key')) {
          throw new Error(
            'Invalid API key. Please check your GEMINI_API_KEY at https://aistudio.google.com/app/apikey'
          )
        }
        if (error.message.includes('quota') || error.message.includes('limit')) {
          throw new Error(
            'API quota exceeded. Check your usage at https://ai.dev/usage'
          )
        }
      }
      
      throw error
    }
  }

  /**
   * Edit existing image with text prompt
   */
  async editImage(options: ImageEditRequest): Promise<ImageGenerationResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'Nano Banana service not available. GEMINI_API_KEY not configured.'
      )
    }

    const startTime = Date.now()

    try {
      console.log('✏️ Nano Banana image edit request:', {
        editPrompt: options.editPrompt.substring(0, 100),
        imageSize: options.imageBuffer.length,
      })

      const imageBase64 = options.imageBuffer.toString('base64')

      const response = await this.model!.generateContent({
        contents: [
          {
            parts: [
              {
                text: options.editPrompt,
              },
              {
                inlineData: {
                  mimeType: options.imageMimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
      })

      const imageBuffer = await this.extractImageFromResponse(response)
      const base64 = imageBuffer.toString('base64')
      const imageUrl = `data:image/png;base64,${base64}`
      const processingTimeMs = Date.now() - startTime

      console.log('✅ Nano Banana image edited successfully', {
        processingTimeMs,
        costInINR: this.COST_IN_INR,
      })

      return {
        image_url: imageUrl,
        revised_prompt: options.editPrompt,
        service: 'nano-banana-edit',
        base64,
        processingTimeMs,
        costInINR: this.COST_IN_INR,
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime
      console.error('❌ Nano Banana image edit error:', error)
      throw error
    }
  }

  /**
   * Fuse multiple images together
   */
  async fuseImages(options: ImageFusionRequest): Promise<ImageGenerationResponse> {
    if (!this.isAvailable()) {
      throw new Error(
        'Nano Banana service not available. GEMINI_API_KEY not configured.'
      )
    }

    if (options.imageBuffers.length < 2) {
      throw new Error('Fusion requires at least 2 images')
    }

    const startTime = Date.now()

    try {
      console.log('🔀 Nano Banana image fusion request:', {
        fusionPrompt: options.fusionPrompt.substring(0, 100),
        imageCount: options.imageBuffers.length,
      })

      // Build parts array with text + all images
      const parts: any[] = [
        {
          text: options.fusionPrompt,
        },
      ]

      // Add all images to parts
      for (let i = 0; i < options.imageBuffers.length; i++) {
        parts.push({
          inlineData: {
            mimeType: options.imageMimeTypes[i],
            data: options.imageBuffers[i].toString('base64'),
          },
        })
      }

      const response = await this.model!.generateContent({
        contents: [
          {
            parts,
          },
        ],
      })

      const imageBuffer = await this.extractImageFromResponse(response)
      const base64 = imageBuffer.toString('base64')
      const imageUrl = `data:image/png;base64,${base64}`
      const processingTimeMs = Date.now() - startTime

      console.log('✅ Nano Banana images fused successfully', {
        processingTimeMs,
        costInINR: this.COST_IN_INR,
      })

      return {
        image_url: imageUrl,
        revised_prompt: options.fusionPrompt,
        service: 'nano-banana-fusion',
        base64,
        processingTimeMs,
        costInINR: this.COST_IN_INR,
      }
    } catch (error) {
      const processingTimeMs = Date.now() - startTime
      console.error('❌ Nano Banana image fusion error:', error)
      throw error
    }
  }

  /**
   * Extract image buffer from Google API response
   */
  private async extractImageFromResponse(response: any): Promise<Buffer> {
    try {
      const candidates = response.response?.candidates || []
      if (!candidates.length) {
        throw new Error('No candidates in response')
      }

      const parts = candidates[0]?.content?.parts || []
      const imagePart = parts.find(
        (part: any) => part.inlineData && part.inlineData.data
      )

      if (!imagePart || !imagePart.inlineData) {
        throw new Error('No image data in response')
      }

      // Convert base64 to buffer
      const base64Data = imagePart.inlineData.data
      return Buffer.from(base64Data, 'base64')
    } catch (error) {
      console.error('Failed to extract image from response:', error)
      throw new Error(
        `Failed to extract image: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// Singleton instance
let instance: NanoBananaClient | null = null

export function getNanoBananaClient(): NanoBananaClient {
  if (!instance) {
    instance = new NanoBananaClient()
  }
  return instance
}

export default getNanoBananaClient()
