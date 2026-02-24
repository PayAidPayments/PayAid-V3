/**
 * POST /api/websites/generate/v2
 * Phase 1B — Website Builder v2: industry-tuned for India SMB.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { generateWebsiteComponents, WEBSITE_BUILDER_INDUSTRIES } from '@/lib/ai/website-builder'
import type { WebsiteBuilderIndustry } from '@/lib/ai/website-builder'

export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'ai-studio')
    const body = await request.json()
    const industry = WEBSITE_BUILDER_INDUSTRIES.some((i) => i.value === body.industry)
      ? (body.industry as WebsiteBuilderIndustry)
      : undefined
    const result = await generateWebsiteComponents({
      prompt: (body.prompt ?? '').trim(),
      style: body.style || 'modern',
      components: body.components || [],
      framework: body.framework || 'nextjs',
      industry,
      businessName: body.businessName?.trim(),
      oneLiner: body.oneLiner?.trim(),
    })
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Website v2 generation error:', error)
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return NextResponse.json(
        { success: false, error: 'Module not licensed', components: [], provider: 'none' },
        { status: 403 }
      )
    }
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate website',
        components: [],
        provider: 'none',
      },
      { status: 500 }
    )
  }
}
