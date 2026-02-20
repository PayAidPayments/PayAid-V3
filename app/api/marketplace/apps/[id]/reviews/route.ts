import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'
import { z } from 'zod'

const createReviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
})

/** GET /api/marketplace/apps/[id]/reviews - Get reviews for an app */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireModuleAccess(request, 'crm')
    const appId = params.id

    const reviews = await prisma.marketplaceAppReview.findMany({
      where: { appId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    return NextResponse.json({
      reviews,
      averageRating: Math.round(avgRating * 100) / 100,
      totalReviews: reviews.length,
    })
  } catch (e) {
    const err = handleLicenseError(e)
    if (err) return err
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to get reviews' },
      { status: 500 }
    )
  }
}

/** POST /api/marketplace/apps/[id]/reviews - Create a review */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')
    const appId = params.id
    const body = await request.json()
    const validated = createReviewSchema.parse(body)

    // Check if user already reviewed this app
    const existing = await prisma.marketplaceAppReview.findUnique({
      where: {
        appId_tenantId: {
          appId,
          tenantId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'You have already reviewed this app' },
        { status: 400 }
      )
    }

    // Check if app is installed (for verified purchase)
    const installation = await prisma.marketplaceAppInstallation.findUnique({
      where: {
        tenantId_appId: {
          tenantId,
          appId,
        },
      },
    })

    const review = await prisma.marketplaceAppReview.create({
      data: {
        appId,
        installationId: installation?.id,
        tenantId,
        userId,
        rating: validated.rating,
        title: validated.title,
        comment: validated.comment,
        isVerified: !!installation,
      },
    })

    // Update app rating
    const allReviews = await prisma.marketplaceAppReview.findMany({
      where: { appId },
      select: { rating: true },
    })
    const newAvgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await prisma.marketplaceApp.update({
      where: { id: appId },
      data: {
        rating: newAvgRating,
      },
    })

    return NextResponse.json({ review }, { status: 201 })
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
      { error: e instanceof Error ? e.message : 'Failed to create review' },
      { status: 500 }
    )
  }
}
