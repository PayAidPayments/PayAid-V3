import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * POST /api/help-center/search
 * AI-powered semantic search for help center articles
 */
export async function POST(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'help-center')

    const body = await request.json()
    const { query, limit = 10 } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    // For now, use full-text search
    // TODO: Integrate with AI service for semantic search
    const articles = await prisma.helpCenterArticle.findMany({
      where: {
        tenantId,
        isPublished: true,
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { viewCount: 'desc' }, // Popular articles first
        { helpfulCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    // Log search for analytics
    await prisma.helpCenterSearchLog.create({
      data: {
        tenantId,
        searchQuery: query,
        resultsCount: articles.length,
      },
    })

    // Calculate relevance scores (simple implementation)
    const scoredArticles = articles.map((article) => {
      let score = 0
      const lowerQuery = query.toLowerCase()
      const lowerTitle = article.title.toLowerCase()
      const lowerContent = article.content.toLowerCase()

      // Title match gets higher score
      if (lowerTitle.includes(lowerQuery)) score += 10
      if (lowerContent.includes(lowerQuery)) score += 5

      // Tag match
      if (article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))) {
        score += 3
      }

      // Popularity boost
      score += Math.log(article.viewCount + 1) * 0.5
      score += Math.log(article.helpfulCount + 1) * 0.3

      return { ...article, relevanceScore: score }
    })

    // Sort by relevance
    scoredArticles.sort((a, b) => b.relevanceScore - a.relevanceScore)

    return NextResponse.json({
      articles: scoredArticles,
      query,
      totalResults: scoredArticles.length,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Help center search error:', error)
    return NextResponse.json(
      { error: 'Failed to search help center' },
      { status: 500 }
    )
  }
}

