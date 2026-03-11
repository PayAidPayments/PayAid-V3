import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { runWhatIfAnalysis, compareScenarios, WhatIfScenario } from '@/lib/ai/what-if-engine'
import { z } from 'zod'

const scenarioSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['pricing', 'hiring', 'product', 'marketing', 'custom']),
  parameters: z.record(z.any()),
})

const whatIfRequestSchema = z.object({
  scenarios: z.array(scenarioSchema).min(1).max(10), // Max 10 scenarios at once
})

/**
 * POST /api/ai/what-if
 * Run what-if analysis for multiple scenarios
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')

    const body = await request.json()
    const validated = whatIfRequestSchema.parse(body)

    // Convert to WhatIfScenario format
    const scenarios: WhatIfScenario[] = validated.scenarios.map((s, index) => ({
      id: `scenario-${Date.now()}-${index}`,
      name: s.name,
      description: s.description || '',
      type: s.type,
      parameters: s.parameters,
      createdAt: new Date(),
    }))

    // Run analysis
    const results = await runWhatIfAnalysis(tenantId, scenarios)

    // Compare scenarios
    const comparison = compareScenarios(results)

    return NextResponse.json({
      success: true,
      results,
      comparison,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('What-if analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to run what-if analysis', details: String(error) },
      { status: 500 }
    )
  }
}
