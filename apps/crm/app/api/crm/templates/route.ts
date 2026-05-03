/**
 * Industry Template API
 * GET /api/crm/templates - List available templates
 * POST /api/crm/templates/apply - Apply template to tenant
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { getAllTemplates, getTemplateById } from '@/lib/crm/industry-templates'
import { applyTemplate, previewTemplate } from '@/lib/crm/template-migration'
import { z } from 'zod'

const applyTemplateSchema = z.object({
  templateId: z.string(),
  preview: z.boolean().optional().default(false),
})

// GET /api/crm/templates - List all templates
export async function GET(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'crm')

    const templates = getAllTemplates()

    return NextResponse.json({
      success: true,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        industry: t.industry,
        description: t.description,
        stageCount: t.stages.length,
        customFieldCount: t.customFields.length,
      })),
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get templates error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get templates' },
      { status: 500 }
    )
  }
}

// POST /api/crm/templates/apply - Apply template
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const { templateId, preview } = applyTemplateSchema.parse(body)

    if (preview) {
      // Return preview without applying
      const previewData = await previewTemplate(tenantId, templateId)
      return NextResponse.json({
        success: true,
        preview: previewData,
      })
    }

    // Apply template
    const result = await applyTemplate(tenantId, templateId)

    return NextResponse.json({
      success: result.success,
      result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Apply template error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to apply template',
      },
      { status: 500 }
    )
  }
}
