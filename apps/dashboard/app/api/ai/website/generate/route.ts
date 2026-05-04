import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { websiteGenerationRequestSchema } from '@/lib/ai/generation/contracts'
import { z } from 'zod'

type WebsiteSection = {
  id: string
  type: 'hero' | 'features' | 'social-proof' | 'cta' | 'faq' | 'contact-form'
  heading: string
  body: string
}

/**
 * POST /api/ai/website/generate
 * Layer 3: website generation scaffold as structured editable sections.
 */
export async function POST(request: NextRequest) {
  try {
    try {
      await requireModuleAccess(request, 'ai-studio')
    } catch (accessError) {
      if (accessError && typeof accessError === 'object' && 'moduleId' in accessError) {
        await requireModuleAccess(request, 'marketing')
      } else {
        throw accessError
      }
    }

    const body = await request.json()
    const input = websiteGenerationRequestSchema.parse(body)

    const objective = input.objective || 'generate qualified leads'
    const tone = input.tone || 'professional and trustworthy'
    const audience = input.targetAudience || 'business customers'

    const sections: WebsiteSection[] = [
      {
        id: 'hero-1',
        type: 'hero',
        heading: `${input.businessName} — built for ${audience}`,
        body: `Primary objective: ${objective}. Tone: ${tone}.`,
      },
      {
        id: 'features-1',
        type: 'features',
        heading: 'Core offerings',
        body: `Summarize top services for ${input.industry || 'your industry'} in 3-5 concise bullets.`,
      },
      {
        id: 'proof-1',
        type: 'social-proof',
        heading: 'Why customers trust us',
        body: 'Add testimonials, metrics, and logos as available.',
      },
      {
        id: 'cta-1',
        type: 'cta',
        heading: 'Book a demo',
        body: 'Primary CTA should open lead form and optionally WhatsApp follow-up.',
      },
      {
        id: 'faq-1',
        type: 'faq',
        heading: 'Frequently asked questions',
        body: 'Generate 4-6 FAQs focused on pricing, onboarding, and support.',
      },
      {
        id: 'contact-1',
        type: 'contact-form',
        heading: 'Contact us',
        body: 'Connect this form directly to PayAid CRM pipeline for lead capture.',
      },
    ]

    return NextResponse.json({
      siteBlueprint: {
        businessName: input.businessName,
        pages: input.pages && input.pages.length > 0 ? input.pages : ['Home', 'Services', 'Contact'],
        sections,
      },
      notes: {
        editable:
          'This endpoint returns structured scaffold sections so the Website Builder can stay editable and business-connected.',
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: err.errors }, { status: 400 })
    }
    return handleLicenseError(err)
  }
}
