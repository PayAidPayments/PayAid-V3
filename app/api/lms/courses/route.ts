import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().int().positive().optional(),
  isPublished: z.boolean().default(false),
})

/**
 * GET /api/lms/courses
 * List courses
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'lms')

    const { searchParams } = new URL(request.url)
    const isPublished = searchParams.get('isPublished')
    const category = searchParams.get('category')

    const where: any = { tenantId }
    if (isPublished !== null) where.isPublished = isPublished === 'true'
    if (category) where.category = category

    const courses = await prisma.lmsCourse.findMany({
      where,
      include: {
        _count: {
          select: {
            enrollments: true,
            modules: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ courses })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get courses error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/lms/courses
 * Create course
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'lms')

    const body = await request.json()
    const validated = createCourseSchema.parse(body)

    const course = await prisma.lmsCourse.create({
      data: {
        tenantId,
        title: validated.title,
        description: validated.description,
        category: validated.category,
        duration: validated.duration,
        isPublished: validated.isPublished,
      },
    })

    return NextResponse.json({ course }, { status: 201 })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Create course error:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}

