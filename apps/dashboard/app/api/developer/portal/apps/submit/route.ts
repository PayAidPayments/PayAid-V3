import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const submitAppSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(10),
  category: z.string(),
  icon: z.string().url().optional().or(z.literal('')),
  pricing: z.string().default('Free'),
  version: z.string().default('1.0.0'),
  changelog: z.string().optional(),
})

/** POST /api/developer/portal/apps/submit - Submit app for marketplace review */
export async function POST(request: NextRequest) {
  try {
    const { userId, tenantId } = await requireModuleAccess(request, 'crm')
    const body = await request.json()
    const validated = submitAppSchema.parse(body)

    // Create app submission (pending approval)
    const app = await prisma.marketplaceApp.create({
      data: {
        name: validated.name,
        description: validated.description,
        category: validated.category,
        icon: validated.icon || null,
        developer: 'Your Organization', // TODO: Get from user/org
        developerId: userId,
        pricing: validated.pricing,
        version: validated.version,
        changelog: validated.changelog,
        isActive: false,
        isApproved: false,
        submittedAt: new Date(),
      },
    })

    return NextResponse.json({
      app: {
        id: app.id,
        name: app.name,
        status: 'pending_review',
      },
      message: 'App submitted successfully. It will be reviewed by our team.',
    }, { status: 201 })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: e.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to submit app' },
      { status: 500 }
    )
  }
}
