import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const createArticleSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().default(false),
  isPublic: z.boolean().default(true),
})

// GET /api/help-center/articles - List help center articles
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')

    const { searchParams } = new URL(request.url)
    const isPublished = searchParams.get('isPublished')
    const isPublic = searchParams.get('isPublic')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const where: any = { tenantId }
    if (isPublished !== null) where.isPublished = isPublished === 'true'
    if (isPublic !== null) where.isPublic = isPublic === 'true'
    if (category) where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ]
    }

    const articles = await prisma.helpCenterArticle.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ articles })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get help center articles error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help center articles' },
      { status: 500 }
    )
  }
}

// POST /api/help-center/articles - Create help center article
export async function POST(request: NextRequest) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'crm')

    const body = await request.json()
    const validated = createArticleSchema.parse(body)

    const article = await prisma.helpCenterArticle.create({
      data: {
        tenantId,
        title: validated.title,
        content: validated.content,
        category: validated.category,
        tags: validated.tags || [],
        isPublished: validated.isPublished,
        isPublic: validated.isPublic,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({ article }, { status: 201 })
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

    console.error('Create help center article error:', error)
    return NextResponse.json(
      { error: 'Failed to create help center article' },
      { status: 500 }
    )
  }
}

