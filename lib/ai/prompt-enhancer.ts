import { getGroqClient } from './groq'
import { getOllamaClient } from './ollama'

/**
 * Enhances a user's image generation prompt using AI to make it more detailed
 * and optimized for image generation models like Gemini 2.5 Flash Image
 */
export async function enhanceImagePrompt(
  userPrompt: string,
  style?: string,
  size?: string
): Promise<{ enhancedPrompt: string; service: string }> {
  const systemPrompt = `You are an expert at creating detailed, optimized prompts for AI image generation models like Google's Gemini 2.5 Flash Image.

Your task is to enhance user prompts to generate better, more detailed, and visually appealing images.

ENHANCEMENT GUIDELINES:
1. Add specific visual details: lighting, composition, colors, mood, atmosphere
2. Include technical photography/art terms when appropriate (e.g., "soft lighting", "rule of thirds", "depth of field")
3. Enhance style descriptions with specific artistic or photographic terms
4. Add details about the subject's appearance, pose, expression, clothing (if applicable)
5. Specify background details and environment
6. Include quality descriptors: "high quality", "detailed", "professional", "sharp focus"
7. Add mood and atmosphere: "vibrant", "serene", "dramatic", "peaceful", "energetic"
8. Keep the core subject and intent from the original prompt
9. Make it specific but not overly verbose (aim for 50-100 words)
10. Optimize for image generation - focus on visual elements

STYLE ENHANCEMENTS:
- realistic: Add "photorealistic", "professional photography", "sharp focus", "high detail"
- artistic: Add "artistic style", "creative composition", "visually striking", "unique perspective"
- cartoon: Add "cartoon style", "animated", "vibrant colors", "playful"
- minimalist: Add "minimalist design", "clean composition", "simple", "elegant"
- vintage: Add "vintage aesthetic", "retro style", "classic", "nostalgic"
- modern: Add "modern design", "contemporary", "sleek", "cutting-edge"

SIZE CONSIDERATIONS:
- Square (1024x1024): Good for balanced compositions, portraits, products
- Portrait (1024x1792): Emphasize vertical elements, full-body shots, tall subjects
- Landscape (1792x1024): Emphasize horizontal elements, wide scenes, panoramic views

IMPORTANT:
- Keep the user's original intent and subject
- Don't change the core meaning
- Enhance with visual details, not rewrite completely
- Return ONLY the enhanced prompt, no explanations or meta-commentary`

  const userMessage = `Original prompt: "${userPrompt}"
${style ? `Style preference: ${style}` : ''}
${size ? `Image size: ${size}` : ''}

Enhance this prompt for optimal image generation. Return ONLY the enhanced prompt, nothing else.`

  let enhancedPrompt = userPrompt
  let service = 'fallback'

  try {
    // Try Groq first (fastest and best at following instructions)
    const groqApiKey = process.env.GROQ_API_KEY
    if (groqApiKey) {
      const groq = getGroqClient()
      const response = await groq.chat([
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ])
      
      enhancedPrompt = response.message.trim()
      // Remove any quotes if the AI wrapped it
      enhancedPrompt = enhancedPrompt.replace(/^["']|["']$/g, '')
      service = 'groq'
      
      console.log('✅ Prompt enhanced using Groq')
      return { enhancedPrompt, service }
    }
  } catch (groqError) {
    console.warn('⚠️ Groq prompt enhancement failed, trying Ollama:', groqError)
  }

  try {
    // Fallback to Ollama
    const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434'
    const ollamaApiKey = process.env.OLLAMA_API_KEY
    
    if (ollamaBaseUrl || ollamaApiKey) {
      const ollama = getOllamaClient()
      const response = await ollama.chat([
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userMessage,
        },
      ])
      
      enhancedPrompt = response.message.trim()
      enhancedPrompt = enhancedPrompt.replace(/^["']|["']$/g, '')
      service = 'ollama'
      
      console.log('✅ Prompt enhanced using Ollama')
      return { enhancedPrompt, service }
    }
  } catch (ollamaError) {
    console.warn('⚠️ Ollama prompt enhancement failed, using basic enhancement:', ollamaError)
  }

  // Fallback: Basic enhancement if AI services are unavailable
  enhancedPrompt = applyBasicEnhancement(userPrompt, style, size)
  service = 'basic'
  
  console.log('✅ Using basic prompt enhancement')
  return { enhancedPrompt, service }
}

/**
 * Basic prompt enhancement when AI services are unavailable
 */
function applyBasicEnhancement(prompt: string, style?: string, size?: string): string {
  let enhanced = prompt

  // Add style-specific enhancements
  if (style) {
    const styleMap: Record<string, string> = {
      realistic: 'photorealistic, professional photography, sharp focus, high detail, natural lighting',
      artistic: 'artistic style, creative composition, visually striking, unique perspective, vibrant colors',
      cartoon: 'cartoon style, animated, vibrant colors, playful, clean lines',
      minimalist: 'minimalist design, clean composition, simple, elegant, negative space',
      vintage: 'vintage aesthetic, retro style, classic, nostalgic, film grain',
      modern: 'modern design, contemporary, sleek, cutting-edge, professional',
    }
    
    if (styleMap[style]) {
      enhanced = `${enhanced}, ${styleMap[style]}`
    }
  }

  // Add quality descriptors
  enhanced = `${enhanced}, high quality, detailed, professional`

  // Add size-specific guidance
  if (size === '1024x1792') {
    enhanced = `${enhanced}, vertical composition, full frame`
  } else if (size === '1792x1024') {
    enhanced = `${enhanced}, horizontal composition, wide angle`
  }

  return enhanced
}
