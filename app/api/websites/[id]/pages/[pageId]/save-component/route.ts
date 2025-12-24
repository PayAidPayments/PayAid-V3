import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const saveComponentSchema = z.object({
  componentName: z.string(),
  code: z.string(),
  description: z.string().optional(),
  type: z.enum(['component', 'page', 'layout']).optional(),
  sectionType: z.string().optional(), // e.g., 'hero', 'features', 'pricing'
})

/**
 * POST /api/websites/[id]/pages/[pageId]/save-component
 * Save a generated component to a website page's contentJson
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'ai-studio')
    const resolvedParams = await params
    const { id: websiteId, pageId } = resolvedParams

    const body = await request.json()
    const validated = saveComponentSchema.parse(body)

    // Verify website belongs to tenant
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        tenantId: tenantId,
      },
    })

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    // Get the page
    const page = await prisma.websitePage.findFirst({
      where: {
        id: pageId,
        websiteId: websiteId,
      },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Get current contentJson
    const currentContent = (page.contentJson as any) || { type: 'page', sections: [] }
    const sections = Array.isArray(currentContent.sections) ? currentContent.sections : []

    // Create component block
    const componentBlock = {
      id: `component-${Date.now()}`,
      type: validated.sectionType || 'component',
      componentName: validated.componentName,
      code: validated.code,
      description: validated.description || '',
      componentType: validated.type || 'component',
      createdAt: new Date().toISOString(),
    }

    // Add component to sections
    const updatedSections = [...sections, componentBlock]

    // Update page
    const updatedPage = await prisma.websitePage.update({
      where: { id: pageId },
      data: {
        contentJson: {
          type: 'page',
          sections: updatedSections,
          components: {
            ...(currentContent.components || {}),
            [validated.componentName]: {
              code: validated.code,
              description: validated.description,
              type: validated.type,
            },
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Component saved successfully',
      page: updatedPage,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Save component error:', error)
    return NextResponse.json(
      { error: 'Failed to save component' },
      { status: 500 }
    )
  }
}

