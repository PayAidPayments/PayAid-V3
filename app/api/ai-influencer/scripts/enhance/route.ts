import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const enhanceScriptSchema = z.object({
  campaignId: z.string(),
  productName: z.string().min(1),
  productDescription: z.string().optional(),
  benefits: z.array(z.string()).optional(),
  tone: z.enum(['casual', 'professional', 'funny']).optional().default('casual'),
})

/**
 * POST /api/ai-influencer/scripts/enhance
 * Generate UGC-style script variations using AI
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId || !payload.userId) {
      return NextResponse.json(
        { error: 'Tenant or user not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const validated = enhanceScriptSchema.parse(body)

    // Verify campaign exists
    const campaign = await prisma.aIInfluencerCampaign.findFirst({
      where: {
        id: validated.campaignId,
        tenantId: payload.tenantId,
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Build script generation prompt
    const benefitsText = validated.benefits?.join(', ') || ''
    const productDesc = validated.productDescription || ''
    
    const prompt = `Generate 3 UGC (User Generated Content) style video scripts for promoting ${validated.productName}.
    
Product Details:
- Name: ${validated.productName}
- Description: ${productDesc}
- Benefits: ${benefitsText}

Generate 3 script variations:
1. Casual tone - friendly, conversational, like a friend recommending a product
2. Professional tone - polished, trustworthy, business-like
3. Funny tone - entertaining, humorous, engaging

Each script should be:
- 30-60 seconds when spoken
- Natural and conversational
- Include a clear call-to-action
- Sound authentic and genuine
- Suitable for social media (Instagram, YouTube Shorts, TikTok)

Return the response as JSON with this structure:
{
  "variations": [
    {
      "type": "casual",
      "text": "script text here",
      "duration": 45
    },
    {
      "type": "professional", 
      "text": "script text here",
      "duration": 50
    },
    {
      "type": "funny",
      "text": "script text here", 
      "duration": 40
    }
  ]
}`

    // Use AI chat endpoint to generate scripts
    const baseUrl = process.env.APP_URL || 'http://localhost:3000'
    const chatResponse = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        message: prompt,
        context: 'You are a professional scriptwriter specializing in UGC-style social media content.',
      }),
    })

    if (!chatResponse.ok) {
      const errorData = await chatResponse.json().catch(() => ({}))
      return NextResponse.json(
        {
          error: 'Failed to generate scripts',
          message: errorData.message || errorData.error || 'Script generation failed',
        },
        { status: chatResponse.status }
      )
    }

    const chatData = await chatResponse.json()
    let variations: any[] = []

    // Try to parse JSON from response
    try {
      const responseText = chatData.response || chatData.message || chatData.text || ''
      
      // Extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                       responseText.match(/```\s*([\s\S]*?)\s*```/)
      
      const jsonText = jsonMatch ? jsonMatch[1] : responseText
      const parsed = JSON.parse(jsonText)
      
      if (parsed.variations && Array.isArray(parsed.variations)) {
        variations = parsed.variations
      } else {
        // Fallback: create variations from response
        variations = [
          {
            type: 'casual',
            text: responseText.substring(0, 200),
            duration: 45,
          },
          {
            type: 'professional',
            text: responseText.substring(200, 400) || responseText,
            duration: 50,
          },
          {
            type: 'funny',
            text: responseText.substring(400) || responseText,
            duration: 40,
          },
        ]
      }
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback:', parseError)
      // Fallback variations
      const responseText = chatData.response || chatData.message || chatData.text || 'Check out this amazing product!'
      variations = [
        {
          type: 'casual',
          text: `Hey everyone! I just tried ${validated.productName} and I'm obsessed! ${productDesc ? productDesc + ' ' : ''}You have to check it out!`,
          duration: 30,
        },
        {
          type: 'professional',
          text: `I'm excited to share ${validated.productName} with you today. ${productDesc || 'This product offers exceptional value.'} ${benefitsText ? 'Key benefits include: ' + benefitsText : ''}`,
          duration: 40,
        },
        {
          type: 'funny',
          text: `Okay, so I found this thing called ${validated.productName} and... wait, why didn't anyone tell me about this sooner?! ${productDesc || "It's actually amazing!"}`,
          duration: 35,
        },
      ]
    }

    // Ensure we have 3 variations
    while (variations.length < 3) {
      variations.push({
        type: ['casual', 'professional', 'funny'][variations.length],
        text: `Script variation ${variations.length + 1} for ${validated.productName}`,
        duration: 40,
      })
    }

    // Create script record
    const script = await prisma.aIInfluencerScript.create({
      data: {
        tenantId: payload.tenantId,
        campaignId: validated.campaignId,
        productName: validated.productName,
        tone: validated.tone,
        variations: variations,
        selectedVariation: null,
      },
    })

    return NextResponse.json({
      script: {
        id: script.id,
        productName: script.productName,
        tone: script.tone,
        variations: script.variations,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Script generation error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate scripts',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

