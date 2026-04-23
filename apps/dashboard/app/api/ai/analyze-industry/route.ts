import { NextRequest, NextResponse } from 'next/server'
import { getGroqClient } from '@/lib/ai/groq'
import { getOllamaClient } from '@/lib/ai/ollama'
import { getHuggingFaceClient } from '@/lib/ai/huggingface'
import { normalizeSelectedModuleIds } from '@/lib/tenant/module-license-filter'
import { shouldIncludeLegacyModuleFields } from '@/lib/taxonomy/canonical-api-mode'

/**
 * POST /api/ai/analyze-industry
 * AI-powered industry analysis to determine recommended modules
 */
export async function POST(request: NextRequest) {
  try {
    const includeLegacy = shouldIncludeLegacyModuleFields()
    const body = await request.json()
    const { industryName, description } = body

    if (!industryName || industryName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Industry name is required' },
        { status: 400 }
      )
    }

    // Build AI prompt for industry analysis
    const systemPrompt = `You are an expert business consultant analyzing industries to recommend software modules. 
Based on market research and industry best practices, analyze the provided industry and recommend:
1. Core modules needed (from: crm, finance, inventory, sales, marketing, hr, projects, communication, analytics, ai-studio)
2. Industry-specific features
3. Key business processes

Always include 'ai-studio' as a core module.

Respond in JSON format:
{
  "coreModules": ["crm", "finance", "ai-studio", ...],
  "industryFeatures": ["feature1", "feature2", ...],
  "description": "Brief description of why these modules are recommended",
  "keyProcesses": ["process1", "process2", ...]
}`

    const userPrompt = `Analyze this industry and recommend modules:
Industry: ${industryName}
${description ? `Description: ${description}` : ''}

Based on market research, what modules and features would this industry need?`

    let response = ''
    let usedService = 'unknown'

    try {
      const groq = getGroqClient()
      const groqResponse = await groq.chat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ])
      response = groqResponse.message || ''
      usedService = 'groq'
    } catch (groqError) {
      console.warn('[AI] Groq failed, trying Ollama:', groqError)
      try {
        const ollama = getOllamaClient()
        const ollamaResponse = await ollama.chat([
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ])
        response = ollamaResponse.message || ''
        usedService = 'ollama'
      } catch (ollamaError) {
        console.warn('[AI] Ollama failed, trying HuggingFace:', ollamaError)
        try {
          const huggingFace = getHuggingFaceClient()
          const hfResponse = await huggingFace.chat([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ])
          response = hfResponse.message || ''
          usedService = 'huggingface'
        } catch (hfError) {
          console.error('[AI] All AI services failed:', hfError)
          // Fallback to default recommendations
          const fallbackModules = normalizeSelectedModuleIds(['crm', 'finance', 'ai-studio'])
          return NextResponse.json({
            industryFeatures: ['general_business_management'],
            description: 'Standard business modules recommended for this industry',
            keyProcesses: ['customer_management', 'financial_tracking'],
            canonical: { suites: fallbackModules },
            ...(includeLegacy
              ? {
                  compatibility: { deprecated: true, coreModules: fallbackModules },
                  coreModules: fallbackModules,
                }
              : {}),
            fallback: true,
          })
        }
      }
    }

    // Try to parse JSON from response
    let parsedResponse
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.warn('[AI] Failed to parse JSON, using fallback:', parseError)
      // Fallback recommendations
      parsedResponse = {
        coreModules: ['crm', 'finance', 'ai-studio'],
        industryFeatures: ['general_business_management'],
        description: 'Standard business modules recommended',
        keyProcesses: ['customer_management', 'financial_tracking'],
        fallback: true,
      }
    }

    const rawCore = Array.isArray(parsedResponse.coreModules) ? parsedResponse.coreModules : []
    const normalizedCoreModules = normalizeSelectedModuleIds(
      rawCore.includes('ai-studio') ? rawCore : [...rawCore, 'ai-studio']
    )
    const { coreModules: _legacyCoreModules, ...parsedResponseWithoutLegacyCore } = parsedResponse

    const normalizedResponse = {
      ...parsedResponseWithoutLegacyCore,
      canonical: {
        suites: normalizedCoreModules,
      },
      ...(includeLegacy
        ? {
            compatibility: {
              deprecated: true as const,
              coreModules: normalizedCoreModules,
            },
            coreModules: normalizedCoreModules,
          }
        : {}),
    }

    return NextResponse.json({
      industryName,
      ...normalizedResponse,
      aiService: usedService,
    })
  } catch (error: any) {
    console.error('Error analyzing industry:', error)
    return NextResponse.json(
      { 
        error: 'Failed to analyze industry',
        details: error.message,
        fallback: {
          coreModules: normalizeSelectedModuleIds(['crm', 'finance', 'ai-studio']),
          industryFeatures: ['general_business_management'],
        }
      },
      { status: 500 }
    )
  }
}

