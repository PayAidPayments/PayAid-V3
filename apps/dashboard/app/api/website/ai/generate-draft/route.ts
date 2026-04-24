import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

const generateDraftSchema = z.object({
  siteId: z.string().optional(),
  businessProfile: z.object({
    businessName: z.string().min(1),
    industry: z.string().min(1),
    city: z.string().optional(),
    productsOrServices: z.array(z.string()).default([]),
    targetAudience: z.string().optional(),
  }),
  websiteGoal: z.enum([
    'lead_generation',
    'appointment_booking',
    'local_presence',
    'campaign_microsite',
    'service_showcase',
  ]),
  pages: z.array(z.string()).min(1),
  brand: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      tone: z.string().optional(),
      logoAssetId: z.string().optional(),
    })
    .optional(),
})

// AI endpoint scaffold: returns deterministic draft contract shape.
// Real model orchestration and prompt templates will be wired in phase implementation.
export async function POST(request: NextRequest) {
  try {
    await requireModuleAccess(request, 'sales')
    const body = await request.json()
    const validated = generateDraftSchema.parse(body)

    const pagePlan = validated.pages.map((pageName) => ({
      pageType: pageName.toLowerCase().replace(/\s+/g, '_'),
      title: pageName,
      sections: ['hero', 'content', 'cta'],
    }))

    return NextResponse.json({
      status: 'ok',
      generationMode: 'structured-template-scaffold',
      draft: {
        siteName: validated.businessProfile.businessName,
        goal: validated.websiteGoal,
        pagePlan,
        seo: {
          title: `${validated.businessProfile.businessName} | ${validated.businessProfile.industry}`,
          description: `Generated draft for ${validated.businessProfile.businessName}.`,
        },
      },
      nextActions: [
        'review_draft',
        'open_visual_builder',
        'map_forms_to_crm',
        'configure_publish_settings',
      ],
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    if (error && typeof error === 'object' && 'moduleId' in error) return handleLicenseError(error)
    console.error('Generate website draft error:', error)
    return NextResponse.json({ error: 'Failed to generate website draft' }, { status: 500 })
  }
}
