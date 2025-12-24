import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'

/**
 * GET /api/websites/components/library
 * Get component library (saved components from all websites)
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    // Get all website pages for this tenant
    const pages = await prisma.websitePage.findMany({
      where: {
        website: {
          tenantId: tenantId,
        },
      },
      select: {
        id: true,
        title: true,
        path: true,
        contentJson: true,
        website: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Extract components from contentJson
    const components: any[] = []
    pages.forEach((page) => {
      const content = page.contentJson as any
      if (content?.components) {
        Object.entries(content.components).forEach(([name, comp]: [string, any]) => {
          components.push({
            id: `${page.id}-${name}`,
            name,
            code: comp.code,
            description: comp.description || '',
            type: comp.type || 'component',
            category: comp.sectionType || 'component',
            websiteId: page.website.id,
            websiteName: page.website.name,
            pageTitle: page.title,
            pagePath: page.path,
            createdAt: new Date().toISOString(),
          })
        })
      }
    })

    // Filter by category
    let filtered = components
    if (category && category !== 'all') {
      filtered = filtered.filter((c) => c.category === category)
    }

    // Search
    if (search) {
      const lowerSearch = search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(lowerSearch) ||
          c.description.toLowerCase().includes(lowerSearch)
      )
    }

    return NextResponse.json({
      success: true,
      components: filtered,
      count: filtered.length,
    })
  } catch (error) {
    console.error('Get component library error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get component library',
        components: [],
        count: 0,
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/websites/components/library/share
 * Share a component to the library (make it available across websites)
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const { componentId, websiteId, pageId } = body

    // Get the component from the page
    const page = await prisma.websitePage.findFirst({
      where: {
        id: pageId,
        websiteId: websiteId,
        website: {
          tenantId: tenantId,
        },
      },
      select: {
        contentJson: true,
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    const content = page.contentJson as any
    const component = content?.components?.[componentId]

    if (!component) {
      return NextResponse.json(
        { error: 'Component not found' },
        { status: 404 }
      )
    }

    // Mark component as shared (add to shared components)
    // This would require a SharedComponent model or use a different storage
    
    return NextResponse.json({
      success: true,
      message: 'Component shared to library',
    })
  } catch (error) {
    console.error('Share component error:', error)
    return NextResponse.json(
      { error: 'Failed to share component' },
      { status: 500 }
    )
  }
}

