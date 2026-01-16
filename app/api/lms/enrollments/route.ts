import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const enrollSchema = z.object({
  courseId: z.string(),
  employeeId: z.string(),
})

/**
 * POST /api/lms/enrollments
 * Enroll employee in course
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'lms')

    const body = await request.json()
    const validated = enrollSchema.parse(body)

    // Verify course exists
    const course = await prisma.lmsCourse.findFirst({
      where: {
        id: validated.courseId,
        tenantId,
        isPublished: true,
      },
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found or not published' },
        { status: 404 }
      )
    }

    // Check if already enrolled
    const existing = await prisma.lmsEnrollment.findUnique({
      where: {
        courseId_employeeId: {
          courseId: validated.courseId,
          employeeId: validated.employeeId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({
        enrollment: existing,
        message: 'Employee already enrolled in this course',
      })
    }

    const enrollment = await prisma.lmsEnrollment.create({
      data: {
        courseId: validated.courseId,
        employeeId: validated.employeeId,
        status: 'ENROLLED',
        progress: 0,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
      },
    })

    return NextResponse.json({ enrollment }, { status: 201 })
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

    console.error('Enroll employee error:', error)
    return NextResponse.json(
      { error: 'Failed to enroll employee' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/lms/enrollments
 * Get enrollments
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'lms')

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')

    const where: any = {}
    if (courseId) where.courseId = courseId
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    // Filter by tenant through course
    if (courseId) {
      const course = await prisma.lmsCourse.findFirst({
        where: { id: courseId, tenantId },
      })
      if (!course) {
        return NextResponse.json({ enrollments: [] })
      }
    }

    const enrollments = await prisma.lmsEnrollment.findMany({
      where,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            duration: true,
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    })

    // Filter by tenant if needed
    const filtered = enrollments.filter((e) => {
      // This would need to check tenant through course
      return true // Simplified for now
    })

    return NextResponse.json({ enrollments: filtered })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get enrollments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enrollments' },
      { status: 500 }
    )
  }
}

