import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'

/**
 * POST /api/websites/generate/suggestions
 * Get AI suggestions for improving generated code
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const { code, componentName, prompt } = body

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an expert React/Next.js code reviewer. Analyze the provided component code and suggest improvements.

Focus on:
1. Code quality and best practices
2. Performance optimizations
3. Accessibility improvements
4. Responsive design enhancements
5. TypeScript type safety
6. Component reusability
7. SEO considerations
8. User experience improvements

Provide specific, actionable suggestions with code examples when helpful.`

    const userPrompt = `Review this React component and provide improvement suggestions:

Component Name: ${componentName || 'GeneratedComponent'}
Original Prompt: ${prompt || 'N/A'}

Code:
\`\`\`tsx
${code}
\`\`\`

Provide:
1. A list of specific improvements (numbered)
2. Brief explanation for each
3. Code examples for critical improvements
4. Priority level (high/medium/low) for each suggestion`

    let suggestions = ''
    let provider = 'none'

    // Try Groq first
    try {
      const groq = getGroqClient()
      const response = await groq.generateCompletion(userPrompt, systemPrompt)
      suggestions = response
      provider = 'groq'
    } catch (groqError) {
      console.log('Groq failed, trying Ollama...')
      
      try {
        const ollama = getOllamaClient()
        const response = await ollama.generateCompletion(userPrompt, systemPrompt)
        suggestions = response
        provider = 'ollama'
      } catch (ollamaError) {
        console.log('Ollama failed, trying Hugging Face...')
        
        try {
          const huggingFace = getHuggingFaceClient()
          const response = await huggingFace.generateCompletion(userPrompt, systemPrompt)
          suggestions = response
          provider = 'huggingface'
        } catch (huggingFaceError) {
          console.error('All AI providers failed:', huggingFaceError)
          return NextResponse.json(
            {
              success: false,
              error: 'All AI providers failed. Please check your API keys.',
              suggestions: '',
              provider: 'none',
            },
            { status: 500 }
          )
        }
      }
    }

    return NextResponse.json({
      success: true,
      suggestions,
      provider,
    })
  } catch (error: any) {
    console.error('Get suggestions error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get suggestions',
        suggestions: '',
        provider: 'none',
      },
      { status: 500 }
    )
  }
}

