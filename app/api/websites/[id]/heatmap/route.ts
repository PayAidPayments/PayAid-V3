import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { requireModuleAccess, handleLicenseError } from '@/lib/middleware/auth'

// GET /api/websites/[id]/heatmap - Get heatmap data for a page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: websiteId } = await params
    const { searchParams } = new URL(request.url)
    const pagePath = searchParams.get('path') || '/'
    const heatmapType = searchParams.get('type') || 'click' // click, scroll, move

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    })

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    // Get page
    const page = await prisma.websitePage.findFirst({
      where: { websiteId, path: pagePath },
    })

    if (!page) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      )
    }

    // Get heatmap data if exists
    const heatmap = await prisma.websiteHeatmap.findFirst({
      where: {
        websiteId,
        pageId: page.id,
        heatmapType,
      },
      orderBy: { createdAt: 'desc' },
    })

    if (heatmap) {
      return NextResponse.json({
        heatmap: {
          id: heatmap.id,
          type: heatmap.heatmapType,
          data: heatmap.dataJson,
          imageUrl: heatmap.imageUrl,
          startDate: heatmap.startDate,
          endDate: heatmap.endDate,
        },
      })
    }

    // Generate heatmap from events
    const events = await prisma.websiteEvent.findMany({
      where: {
        websiteId,
        pageId: page.id,
        eventType: heatmapType === 'click' ? 'click' : heatmapType === 'scroll' ? 'scroll' : 'move',
      },
      take: 10000, // Limit for performance
    })

    // Aggregate click positions
    const heatmapData: Record<string, number> = {}
    events.forEach((event) => {
      const metadata = event.metadata as any
      if (metadata?.x && metadata?.y) {
        const key = `${Math.floor(metadata.x / 10) * 10},${Math.floor(metadata.y / 10) * 10}`
        heatmapData[key] = (heatmapData[key] || 0) + 1
      }
    })

    return NextResponse.json({
      heatmap: {
        type: heatmapType,
        data: heatmapData,
        imageUrl: null,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        endDate: new Date(),
      },
    })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Get heatmap error:', error)
    return NextResponse.json(
      { error: 'Failed to get heatmap data' },
      { status: 500 }
    )
  }
}

// POST /api/websites/[id]/heatmap - Generate heatmap
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'crm')
    const { id: websiteId } = await params
    const body = await request.json()
    const { pagePath, heatmapType, startDate, endDate } = body

    const website = await prisma.website.findFirst({
      where: { id: websiteId, tenantId },
    })

    if (!website) {
      return NextResponse.json(
        { error: 'Website not found' },
        { status: 404 }
      )
    }

    // Get or create page
    let page = await prisma.websitePage.findFirst({
      where: { websiteId, path: pagePath },
    })

    if (!page) {
      page = await prisma.websitePage.create({
        data: {
          websiteId,
          path: pagePath,
          title: pagePath,
          contentJson: {},
          isPublished: true,
        },
      })
    }

    // Get events for the period
    const events = await prisma.websiteEvent.findMany({
      where: {
        websiteId,
        pageId: page.id,
        eventType: heatmapType === 'click' ? 'click' : heatmapType === 'scroll' ? 'scroll' : 'move',
        occurredAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
    })

    // Aggregate data
    const heatmapData: Record<string, number> = {}
    events.forEach((event) => {
      const metadata = event.metadata as any
      if (metadata?.x && metadata?.y) {
        const key = `${Math.floor(metadata.x / 10) * 10},${Math.floor(metadata.y / 10) * 10}`
        heatmapData[key] = (heatmapData[key] || 0) + 1
      }
    })

    // Save heatmap
    const heatmap = await prisma.websiteHeatmap.create({
      data: {
        websiteId,
        pageId: page.id,
        heatmapType,
        dataJson: heatmapData,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        tenantId,
      },
    })

    return NextResponse.json({ heatmap }, { status: 201 })
  } catch (error: any) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Create heatmap error:', error)
    return NextResponse.json(
      { error: 'Failed to create heatmap' },
      { status: 500 }
    )
  }
}

