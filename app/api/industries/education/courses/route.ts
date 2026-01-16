import { NextRequest, NextResponse } from 'next/server'
import { requireModuleAccess } from '@/lib/middleware/license'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

const createCourseSchema = z.object({
  courseCode: z.string(),
  courseName: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  duration: z.number().optional(),
  fee: z.number().optional(),
  maxStudents: z.number().optional(),
  instructorName: z.string().optional(),
  schedule: z.any().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'education')
    
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = { tenantId }
    if (status) where.status = status

    const courses = await prisma.educationCourse.findMany({
      where,
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ courses })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'education')
    
    const body = await request.json()
    const data = createCourseSchema.parse(body)

    const course = await prisma.educationCourse.create({
      data: {
        tenantId,
        courseCode: data.courseCode,
        courseName: data.courseName,
        description: data.description,
        category: data.category,
        duration: data.duration,
        fee: data.fee,
        maxStudents: data.maxStudents,
        instructorName: data.instructorName,
        schedule: data.schedule,
      },
    })

    return NextResponse.json(course, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

