import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { generateWebsiteComponents } from '@/lib/ai/website-builder'

/**
 * POST /api/websites/generate/ab-test
 * Generate A/B test variations with suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const { prompt, componentType, testHypothesis } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Generate variant A (control)
    const variantA = await generateWebsiteComponents({
      prompt: `${prompt} (variant A: control version)`,
      style: 'modern',
      components: [componentType || 'hero'],
      framework: 'nextjs',
    })

    // Generate variant B (test)
    const variantB = await generateWebsiteComponents({
      prompt: `${prompt} (variant B: ${testHypothesis || 'optimized version'})`,
      style: 'modern',
      components: [componentType || 'hero'],
      framework: 'nextjs',
    })

    // Generate testing suggestions
    const suggestions = [
      'Test different CTA button colors and text',
      'Compare headline variations for engagement',
      'Test image placement (left vs right)',
      'Measure conversion rates for each variant',
      'Test different value propositions',
    ]

    return NextResponse.json({
      success: true,
      variantA: variantA.success ? variantA.components[0] : null,
      variantB: variantB.success ? variantB.components[0] : null,
      suggestions,
      testHypothesis: testHypothesis || 'Optimize for conversion',
    })
  } catch (error: any) {
    console.error('A/B test generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate A/B test variants',
      },
      { status: 500 }
    )
  }
}

