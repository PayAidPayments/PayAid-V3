import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'
import { z } from 'zod'

const updateArticleSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean().optional(),
  isPublic: z.boolean().optional(),
})

/**
 * GET /api/help-center/articles/[id]
 * Get a single help center article
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const articleId = params.id

    const article = await prisma.helpCenterArticle.findUnique({
      where: { id: articleId },
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

    if (!article || article.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ article })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get help center article error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/help-center/articles/[id]
 * Update a help center article
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const articleId = params.id

    const body = await request.json()
    const validated = updateArticleSchema.parse(body)

    const article = await prisma.helpCenterArticle.findUnique({
      where: { id: articleId },
    })

    if (!article || article.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.helpCenterArticle.update({
      where: { id: articleId },
      data: validated,
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

    return NextResponse.json({ article: updated })
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

    console.error('Update help center article error:', error)
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/help-center/articles/[id]
 * Delete a help center article
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const articleId = params.id

    const article = await prisma.helpCenterArticle.findUnique({
      where: { id: articleId },
    })

    if (!article || article.tenantId !== tenantId) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    await prisma.helpCenterArticle.delete({
      where: { id: articleId },
    })

    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Delete help center article error:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}

