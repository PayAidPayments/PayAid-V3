import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'
import { analyzePromptContext, formatClarifyingQuestions } from '@/lib/ai/context-analyzer'
import { prisma } from '@/lib/db/prisma'
import { prismaWithRetry } from '@/lib/db/connection-retry'
import { z } from 'zod'

const generatePostSchema = z.object({
  topic: z.string().min(1),
  platform: z.string().optional(),
  tone: z.string().optional(),
  length: z.string().optional(),
})

// POST /api/ai/generate-post - Generate social media post using AI
export async function POST(request: NextRequest) {
  try {
    // Check AI Studio module license
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = generatePostSchema.parse(body)

    // Check if topic has enough detail
    if (!validated.topic || validated.topic.trim().length < 10) {
      return NextResponse.json({
        error: 'Topic too vague',
        message: 'To create an engaging post, I need more details about the topic.',
        needsClarification: true,
        suggestedQuestions: [
          'What is the main message or theme of this post?',
          'What should readers learn or take away?',
          'Is this about a product, company update, industry insight, or something else?',
        ],
      }, { status: 400 })
    }

    // Get business context for better post generation
    const tenant = await prismaWithRetry(() =>
      prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          name: true,
          website: true,
        },
      })
    )

    // Build system prompt for post generation
    const systemPrompt = `You are an expert social media content creator specializing in creating engaging, professional social media posts for businesses.

Business Context:
- Business Name: ${tenant?.name || 'Business'}
- Website: ${tenant?.website || 'N/A'}

Platform: ${validated.platform || 'general'}
Tone: ${validated.tone || 'professional'}
Length: ${validated.length || 'medium'}

CRITICAL INSTRUCTIONS:
1. DO NOT simply copy the user's input. You must CREATE a completely new, engaging social media post based on the topic.
2. FIX any spelling mistakes, grammar errors, or typos in the user's input automatically.
3. EXPAND the content to make it engaging, professional, and shareable.
4. Create a compelling hook/opening line that grabs attention.
5. Include a clear call-to-action when appropriate.
6. Use relevant hashtags (3-5 maximum) that are specific to the content, not generic ones like #Business #Growth #Success.
7. Match the platform's best practices and character limits.
8. Make the content authentic, relatable, and professional.
9. If the topic mentions a discount, offer, or promotion, make it exciting and clear.
10. Use emojis sparingly and appropriately for the platform.

IMPORTANT: Your output should be a complete, polished social media post that is ready to publish. Do NOT just add hashtags to the user's input.`

    const userPrompt = `Create a ${validated.length || 'medium'}-length social media post for ${validated.platform || 'general'} platform with a ${validated.tone || 'professional'} tone about: ${validated.topic}

Remember to:
- Fix any spelling or grammar errors in the topic
- Create engaging, original content (don't just copy the topic)
- Make it professional and ready to publish
- Include relevant, specific hashtags`

    // Try to generate post using AI services
    let generatedPost = ''
    let usedService = 'rule-based'

    try {
      // Try Groq first (fastest)
      const groqApiKey = process.env.GROQ_API_KEY
      if (groqApiKey) {
        const groq = getGroqClient()
        const response = await groq.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ])
        generatedPost = response.message
        usedService = 'groq'
        console.log('✅ Post generated using Groq')
      } else {
        throw new Error('Groq not configured')
      }
    } catch (groqError) {
      console.warn('⚠️ Groq post generation failed, trying Ollama...', groqError)
      try {
        // Fallback to Ollama
        const ollama = getOllamaClient()
        const response = await ollama.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ])
        generatedPost = response.message
        usedService = 'ollama'
        console.log('✅ Post generated using Ollama')
      } catch (ollamaError) {
        console.warn('⚠️ Ollama post generation failed, trying Hugging Face...', ollamaError)
        try {
          // Fallback to Hugging Face
          const huggingFace = getHuggingFaceClient()
          const response = await huggingFace.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ])
          generatedPost = response.message
          usedService = 'huggingface'
          console.log('✅ Post generated using Hugging Face')
        } catch (huggingFaceError) {
          console.warn('⚠️ All AI services failed, using enhanced rule-based generation...', huggingFaceError)
          // Enhanced fallback with better content generation
          generatedPost = generateEnhancedPost(validated.topic, validated.platform, validated.tone, validated.length, tenant?.name)
          usedService = 'rule-based'
        }
      }
    }

    return NextResponse.json({
      post: generatedPost,
      service: usedService,
      platform: validated.platform,
      tone: validated.tone,
      length: validated.length,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Post generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate post', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

/**
 * Enhanced rule-based post generation that actually creates content
 * This is a fallback when AI services are unavailable
 */
function generateEnhancedPost(topic: string, platform?: string, tone?: string, length?: string, businessName?: string): string {
  // Fix common spelling mistakes
  let correctedTopic = topic
    .replace(/promotoe/gi, 'promote')
    .replace(/buisness/gi, 'business')
    .replace(/recieve/gi, 'receive')
    .replace(/seperate/gi, 'separate')
    .replace(/occured/gi, 'occurred')
    .replace(/accomodate/gi, 'accommodate')
    .replace(/definately/gi, 'definitely')
    .replace(/neccessary/gi, 'necessary')
    .replace(/sucess/gi, 'success')
    .replace(/sucessful/gi, 'successful')

  const platformEmojis: Record<string, string> = {
    facebook: '📘',
    instagram: '📷',
    linkedin: '💼',
    twitter: '🐦',
    youtube: '📺',
  }

  const emoji = platformEmojis[platform || 'general'] || '✨'
  const companyName = businessName || 'We'

  // Extract key information from topic
  const isOffer = /offer|discount|sale|promotion|deal|special|50%|half|off/gi.test(correctedTopic)
  const hasDate = correctedTopic.match(/(january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}/gi)
  const hasPercentage = correctedTopic.match(/\d+%/g)
  const hasService = /service|services/gi.test(correctedTopic)

  // Build engaging post
  let post = ''

  // Opening hook
  if (isOffer && hasPercentage) {
    const percentage = hasPercentage[0]
    if (tone === 'enthusiastic' || tone === 'friendly') {
      post += `${emoji} 🎉 Exciting News! ${companyName} is thrilled to announce an incredible ${percentage} discount! 🎉\n\n`
    } else {
      post += `${emoji} ${companyName} is pleased to announce a special ${percentage} discount.\n\n`
    }
  } else {
    post += `${emoji} `
  }

  // Main content - create engaging description
  if (isOffer) {
    if (hasDate) {
      post += `For the entire month of ${hasDate[0]}, ${companyName} is offering ${hasPercentage?.[0] || '50%'} off on all ${hasService ? 'services' : 'products'}.\n\n`
    } else {
      post += `${companyName} is offering ${hasPercentage?.[0] || '50%'} off on all ${hasService ? 'services' : 'products'}.\n\n`
    }

    // Add value proposition
    if (tone === 'enthusiastic') {
      post += `This is the perfect time to take advantage of our premium ${hasService ? 'services' : 'products'} at an unbeatable price! Don't miss out on this limited-time opportunity.\n\n`
    } else if (tone === 'friendly') {
      post += `We'd love to help you with our ${hasService ? 'services' : 'products'} at this special rate. This offer won't last long!\n\n`
    } else {
      post += `Take advantage of this special offer to experience our ${hasService ? 'services' : 'products'} at a discounted rate.\n\n`
    }
  } else {
    // Generic post - expand on the topic
    const sentences = correctedTopic.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length > 0) {
      post += correctedTopic.charAt(0).toUpperCase() + correctedTopic.slice(1)
      if (!correctedTopic.endsWith('.') && !correctedTopic.endsWith('!') && !correctedTopic.endsWith('?')) {
        post += '.'
      }
    } else {
      post += correctedTopic
    }
    post += '\n\n'
  }

  // Call to action
  if (isOffer) {
    if (tone === 'enthusiastic') {
      post += `🚀 Act now and save! Contact us today to get started.\n\n`
    } else {
      post += `Contact us to learn more and take advantage of this offer.\n\n`
    }
  } else if (tone === 'friendly') {
    post += `We'd love to hear your thoughts! Feel free to reach out if you have any questions.\n\n`
  }

  // Platform-specific hashtags
  const hashtags: string[] = []
  
  if (isOffer) {
    hashtags.push('#SpecialOffer', '#Discount', '#LimitedTime')
  }
  
  if (hasService) {
    hashtags.push('#Services', '#BusinessSolutions')
  }
  
  if (platform === 'linkedin') {
    hashtags.push('#BusinessGrowth', '#ProfessionalServices')
  } else if (platform === 'instagram') {
    hashtags.push('#Business', '#Offer')
  } else {
    hashtags.push('#Business', '#Growth')
  }

  // Add business-specific hashtag if available
  if (businessName) {
    const businessTag = businessName.replace(/[^a-zA-Z0-9]/g, '')
    if (businessTag.length > 0 && businessTag.length < 20) {
      hashtags.push(`#${businessTag}`)
    }
  }

  // Limit hashtags to 5
  const finalHashtags = hashtags.slice(0, 5).join(' ')
  post += finalHashtags

  // Adjust length
  if (length === 'short') {
    // Keep only first paragraph and hashtags
    const lines = post.split('\n\n')
    post = lines[0] + '\n\n' + finalHashtags
  } else if (length === 'long' && !isOffer) {
    post += '\n\n' + `At ${companyName}, we're committed to delivering excellence. Thank you for being part of our journey!`
  }

  return post.trim()
}
