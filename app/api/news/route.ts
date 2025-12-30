import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth/jwt'
import { prisma } from '@/lib/db/prisma'

/**
 * GET /api/news
 * Get news items for the current tenant
 * 
 * Query params:
 * - urgency: Filter by urgency (critical, important, informational, opportunity, warning, growth)
 * - industry: Filter by industry
 * - category: Filter by category
 * - limit: Number of items to return (default: 20)
 * - unreadOnly: Only return unread items (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const tenantId = payload.tenantId

    // Skip connection test - go directly to query
    // Connection tests can fail due to pool exhaustion even when database is working
    // The actual query will succeed or fail, which is more reliable

    const searchParams = request.nextUrl.searchParams
    const urgency = searchParams.get('urgency')
    const industry = searchParams.get('industry')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Get tenant's industry for filtering
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { industry: true },
    })

    // Build where clause
    const where: any = {
      OR: [
        { tenantId }, // Tenant-specific news
        { tenantId: null, industry: tenant?.industry || null }, // Industry-specific news
        { tenantId: null, industry: 'all' }, // General news
      ],
      isDismissed: false,
    }

    if (urgency) {
      where.urgency = urgency
    }

    if (industry) {
      where.industry = industry
    }

    if (category) {
      where.category = category
    }

    if (unreadOnly) {
      where.isRead = false
    }

    // Get news items
    const newsItems = await prisma.newsItem.findMany({
      where,
      orderBy: [
        { urgency: 'asc' }, // critical first
        { createdAt: 'desc' }, // newest first
      ],
      take: limit,
    })

    // Group by urgency for easier frontend rendering
    const grouped = {
      critical: newsItems.filter((n) => n.urgency === 'critical'),
      important: newsItems.filter((n) => n.urgency === 'important'),
      informational: newsItems.filter((n) => n.urgency === 'informational'),
      opportunity: newsItems.filter((n) => n.urgency === 'opportunity'),
      warning: newsItems.filter((n) => n.urgency === 'warning'),
      growth: newsItems.filter((n) => n.urgency === 'growth'),
    }

    // Count unread items
    const unreadCount = await prisma.newsItem.count({
      where: {
        ...where,
        isRead: false,
      },
    })

    return NextResponse.json({
      newsItems,
      grouped,
      unreadCount,
      total: newsItems.length,
    })
  } catch (error: any) {
    console.error('Error fetching news:', error)
    
    // Handle Prisma database connection errors - but don't fail on pool exhaustion
    const isPoolExhausted = error?.message?.includes('MaxClientsInSessionMode') || 
                            error?.message?.includes('max clients reached')
    
    if (isPoolExhausted) {
      // Pool exhausted - return empty results instead of error
      console.warn('Database pool exhausted for news API, returning empty results')
      return NextResponse.json({
        newsItems: [],
        grouped: {
          critical: [],
          important: [],
          informational: [],
          opportunity: [],
          warning: [],
          growth: [],
        },
        unreadCount: 0,
        total: 0,
      })
    }
    
    // Handle other Prisma database connection errors
    if (error?.code?.startsWith('P1') || error?.message?.includes('connection')) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: error.message,
          code: error.code,
          troubleshooting: {
            message: 'Unable to connect to the database. Please check your database connection.',
            steps: [
              'Check if your database server is running',
              'Verify DATABASE_URL is configured correctly in environment variables',
              'If using Supabase, check if your project is paused (free tier auto-pauses after 7 days)',
              'Resume your Supabase project from the dashboard if paused',
              'Try using a direct connection URL instead of a pooler URL',
              'Verify database migrations have been completed',
              'Check firewall settings if using a remote database',
            ],
          },
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        error: 'Failed to fetch news items',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/news
 * Create a new news item (for admin/system use)
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    let payload
    try {
      payload = verifyToken(token)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (!payload.tenantId) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    const tenantId = payload.tenantId

    const body = await request.json()
    const {
      title,
      summary,
      description,
      source,
      category,
      urgency = 'informational',
      icon,
      industry,
      industryType,
      location,
      businessImpact,
      recommendedActions,
      sourceUrl,
      sourceName,
      publishedAt,
      expiresAt,
      tags = [],
    } = body

    const newsItem = await prisma.newsItem.create({
      data: {
        tenantId,
        title,
        summary,
        description,
        source,
        category,
        urgency,
        icon,
        industry,
        industryType,
        location,
        businessImpact,
        recommendedActions,
        sourceUrl,
        sourceName,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        tags,
      },
    })

    return NextResponse.json(newsItem, { status: 201 })
  } catch (error: any) {
    console.error('Error creating news item:', error)
    
    // Handle Prisma database connection errors
    if (error?.code?.startsWith('P1') || error?.message?.includes('connection')) {
      return NextResponse.json(
        {
          error: 'Database connection failed',
          details: error.message,
          code: error.code,
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      {
        error: 'Failed to create news item',
        details: error.message || 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

