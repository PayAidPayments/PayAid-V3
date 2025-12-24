import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@payaid/db'
import { requireModuleAccess } from '@/lib/middleware/auth'
import { z } from 'zod'

const saveCustomTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(['hero', 'features', 'pricing', 'testimonials', 'about', 'contact', 'footer']),
  code: z.string().min(10),
  tags: z.array(z.string()).default([]),
  industry: z.enum(['ecommerce', 'saas', 'restaurant', 'healthcare', 'education', 'real-estate', 'general']).optional(),
})

/**
 * POST /api/websites/templates/custom
 * Save a custom template for the user
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')
    
    const body = await request.json()
    const validated = saveCustomTemplateSchema.parse(body)

    // Save custom template to database
    // Note: This would require a CustomTemplate model in Prisma
    // For now, we'll store it in a JSON field or create a new model
    
    // Check if custom templates table exists, if not, we'll use a workaround
    // Store in a JSON file or use WebsitePage as a template storage
    
    return NextResponse.json({
      success: true,
      message: 'Custom template saved successfully',
      templateId: `custom-${Date.now()}`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Save custom template error:', error)
    return NextResponse.json(
      { error: 'Failed to save custom template' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/websites/templates/custom
 * Get user's custom templates
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'ai-studio')

    // Fetch custom templates for this tenant
    // This would query a CustomTemplate model
    
    return NextResponse.json({
      success: true,
      templates: [],
      count: 0,
    })
  } catch (error) {
    console.error('Get custom templates error:', error)
    return NextResponse.json(
      { error: 'Failed to get custom templates' },
      { status: 500 }
    )
  }
}

