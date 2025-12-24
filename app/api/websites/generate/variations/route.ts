import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { generateWebsiteComponents } from '@/lib/ai/website-builder'

/**
 * POST /api/websites/generate/variations
 * Generate multiple variations of a component
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const { prompt, style, components, count = 3 } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Prompt is required',
          variations: [],
        },
        { status: 400 }
      )
    }

    // Generate multiple variations
    const variations = []
    const styles = ['modern', 'classic', 'minimal', 'bold', 'elegant']
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      try {
        const variationStyle = styles[i % styles.length]
        const variationPrompt = `${prompt} (variation ${i + 1}, ${variationStyle} style)`
        
        const result = await generateWebsiteComponents({
          prompt: variationPrompt,
          style: variationStyle as any,
          components: components || [],
          framework: 'nextjs',
        })

        if (result.success) {
          variations.push({
            variation: i + 1,
            style: variationStyle,
            ...result,
          })
        }
      } catch (error) {
        console.error(`Variation ${i + 1} generation error:`, error)
        // Continue with next variation
      }
    }

    return NextResponse.json({
      success: true,
      variations,
      count: variations.length,
    })
  } catch (error: any) {
    console.error('Generate variations error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate variations',
        variations: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}

