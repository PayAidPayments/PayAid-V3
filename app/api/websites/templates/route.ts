import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { componentTemplates, getTemplatesByCategory, searchTemplates, getTemplatesByIndustry } from '@/lib/templates/website-components'

/**
 * GET /api/websites/templates
 * Get pre-built component templates
 */
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'ai-studio')

    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as any
    const industry = searchParams.get('industry') as any
    const search = searchParams.get('search')

    let templates = componentTemplates

    // Filter by category
    if (category && category !== 'all') {
      templates = getTemplatesByCategory(category)
    }

    // Filter by industry
    if (industry && industry !== 'all') {
      const industryTemplates = getTemplatesByIndustry(industry)
      templates = templates.filter((t) => industryTemplates.includes(t))
    }

    // Search
    if (search) {
      templates = searchTemplates(search)
    }

    return NextResponse.json({
      success: true,
      templates,
      count: templates.length,
    })
  } catch (error: any) {
    console.error('Get templates error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get templates',
        templates: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}

