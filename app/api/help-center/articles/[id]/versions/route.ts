import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/help-center/articles/[id]/versions
 * Get version history for an article
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'help-center')

    const article = await prisma.helpCenterArticle.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          include: {
            article: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      article: {
        id: article.id,
        title: article.title,
        version: article.version,
      },
      versions: article.versions,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get article versions error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article versions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/help-center/articles/[id]/versions
 * Create a new version of an article
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId, userId } = await requireModuleAccess(request, 'help-center')

    const article = await prisma.helpCenterArticle.findFirst({
      where: {
        id: params.id,
        tenantId,
      },
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { title, content } = body

    // Save current version to history
    await prisma.helpCenterArticleVersion.create({
      data: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        version: article.version,
        authorId: article.authorId,
      },
    })

    // Update article with new version
    const updatedArticle = await prisma.helpCenterArticle.update({
      where: { id: article.id },
      data: {
        title: title || article.title,
        content: content || article.content,
        version: article.version + 1,
        authorId: userId,
      },
    })

    return NextResponse.json({ article: updatedArticle })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Create article version error:', error)
    return NextResponse.json(
      { error: 'Failed to create article version' },
      { status: 500 }
    )
  }
}

