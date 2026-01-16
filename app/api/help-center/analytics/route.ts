import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/license'

/**
 * GET /api/help-center/analytics
 * Get help center analytics
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'help-center')

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    const end = endDate ? new Date(endDate) : new Date()

    // Popular articles
    const popularArticles = await prisma.helpCenterArticle.findMany({
      where: {
        tenantId,
        isPublished: true,
      },
      orderBy: { viewCount: 'desc' },
      take: 10,
      select: {
        id: true,
        title: true,
        viewCount: true,
        helpfulCount: true,
        notHelpfulCount: true,
      },
    })

    // Search analytics
    const searchStats = await prisma.helpCenterSearchLog.groupBy({
      by: ['searchQuery'],
      where: {
        tenantId,
        timestamp: { gte: start, lte: end },
      },
      _count: { searchQuery: true },
      orderBy: { _count: { searchQuery: 'desc' } },
      take: 10,
    })

    // Total stats
    const [totalArticles, totalViews, totalSearches, totalHelpful] = await Promise.all([
      prisma.helpCenterArticle.count({
        where: { tenantId, isPublished: true },
      }),
      prisma.helpCenterArticle.aggregate({
        where: { tenantId, isPublished: true },
        _sum: { viewCount: true },
      }),
      prisma.helpCenterSearchLog.count({
        where: { tenantId, timestamp: { gte: start, lte: end } },
      }),
      prisma.helpCenterArticle.aggregate({
        where: { tenantId, isPublished: true },
        _sum: { helpfulCount: true },
      }),
    ])

    // Category distribution
    const categoryStats = await prisma.helpCenterArticle.groupBy({
      by: ['category'],
      where: {
        tenantId,
        isPublished: true,
      },
      _count: { category: true },
    })

    return NextResponse.json({
      popularArticles,
      topSearches: searchStats.map((s) => ({
        query: s.searchQuery,
        count: s._count.searchQuery,
      })),
      totalArticles,
      totalViews: totalViews._sum.viewCount || 0,
      totalSearches,
      totalHelpful: totalHelpful._sum.helpfulCount || 0,
      categoryDistribution: categoryStats.map((c) => ({
        category: c.category || 'Uncategorized',
        count: c._count.category,
      })),
      period: {
        start,
        end,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }

    console.error('Get help center analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch help center analytics' },
      { status: 500 }
    )
  }
}

