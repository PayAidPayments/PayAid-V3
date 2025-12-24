import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { generateWebsiteComponents } from '@/lib/ai/website-builder'

/**
 * POST /api/websites/generate
 * Generate React/Next.js components from natural language prompt
 * Uses Groq → Ollama → Hugging Face fallback chain
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and module access (websites are part of ai-studio module)
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const { prompt, style, components, framework } = body
    
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Prompt is required and must be a non-empty string',
          components: [],
          provider: 'none',
        },
        { status: 400 }
      )
    }
    
    // Generate components using AI
    const result = await generateWebsiteComponents({
      prompt: prompt.trim(),
      style: style || 'modern',
      components: components || [],
      framework: framework || 'nextjs',
    })
    
    // Log generation result (for debugging)
    console.log('Website generation result:', {
      success: result.success,
      componentCount: result.components.length,
      provider: result.provider,
      tenantId,
    })
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Website generation error:', error)
    
    // Handle license errors
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return NextResponse.json(
        { 
          success: false,
          error: 'CRM module not licensed',
          components: [],
          provider: 'none',
        },
        { status: 403 }
      )
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate website components',
        components: [],
        provider: 'none',
      },
      { status: 500 }
    )
  }
}

