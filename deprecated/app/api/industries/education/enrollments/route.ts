import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createEnrollmentSchema = z.object({
  studentId: z.string(),
  courseId: z.string(),
  feePaid: z.number().optional(),
  feeDue: z.number().optional(),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'education')
    
    const searchParams = request.nextUrl.searchParams
    const studentId = searchParams.get('studentId')
    const courseId = searchParams.get('courseId')
    const status = searchParams.get('status')

    const where: any = { tenantId }
    if (studentId) where.studentId = studentId
    if (courseId) where.courseId = courseId
    if (status) where.status = status

    const enrollments = await prisma.educationEnrollment.findMany({
      where,
      include: {
        student: true,
        course: true,
      },
      orderBy: { enrollmentDate: 'desc' },
    })

    return NextResponse.json({ enrollments })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'education')
    
    const body = await request.json()
    const data = createEnrollmentSchema.parse(body)

    const enrollment = await prisma.educationEnrollment.create({
      data: {
        tenantId,
        studentId: data.studentId,
        courseId: data.courseId,
        feePaid: data.feePaid,
        feeDue: data.feeDue,
        notes: data.notes,
      },
      include: {
        student: true,
        course: true,
      },
    })

    return NextResponse.json(enrollment, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

