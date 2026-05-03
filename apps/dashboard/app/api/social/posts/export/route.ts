import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

const CHANNELS = ['EMAIL', 'WHATSAPP', 'SMS', 'FACEBOOK', 'INSTAGRAM', 'TWITTER', 'LINKEDIN', 'YOUTUBE'] as const

function escapeCsv(value: unknown): string {
  const raw = String(value ?? '')
  if (raw.includes(',') || raw.includes('"') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

function buildMetadataRows(params: {
  channel: string
  status: string
  from: string
  to: string
  sort: string
  maxRows: number
  totalRows: number
}): string[][] {
  const nowIso = new Date().toISOString()
  return [
    ['meta', 'exportedAt', nowIso],
    ['meta', 'channelFilter', params.channel || 'ALL'],
    ['meta', 'statusFilter', params.status || 'ALL'],
    ['meta', 'fromDate', params.from || ''],
    ['meta', 'toDate', params.to || ''],
    ['meta', 'sort', params.sort === 'created_asc' ? 'created_asc' : 'created_desc'],
    ['meta', 'maxRows', String(params.maxRows)],
    ['meta', 'exportedRows', String(params.totalRows)],
  ]
}

/**
 * GET /api/social/posts/export
 * Exports filtered social history rows as CSV.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { searchParams } = new URL(request.url)
    const channel = (searchParams.get('channel') || '').trim().toUpperCase()
    const status = (searchParams.get('status') || '').trim().toUpperCase()
    const from = (searchParams.get('from') || '').trim()
    const to = (searchParams.get('to') || '').trim()
    const sort = (searchParams.get('sort') || 'created_desc').trim().toLowerCase()
    const maxRowsRaw = Number(searchParams.get('maxRows') || 5000)
    const maxRows = Number.isFinite(maxRowsRaw) ? Math.min(Math.max(Math.trunc(maxRowsRaw), 1), 10000) : 5000

    const where: Record<string, unknown> = { tenantId }
    if (channel && (CHANNELS as readonly string[]).includes(channel)) where.channel = channel
    if (status) where.status = status
    if (from || to) {
      const createdAt: Record<string, Date> = {}
      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000Z`)
        if (!Number.isNaN(fromDate.getTime())) createdAt.gte = fromDate
      }
      if (to) {
        const toDate = new Date(`${to}T23:59:59.999Z`)
        if (!Number.isNaN(toDate.getTime())) createdAt.lte = toDate
      }
      if (Object.keys(createdAt).length > 0) where.createdAt = createdAt
    }

    const orderBy =
      sort === 'created_asc'
        ? ({ createdAt: 'asc' } as const)
        : ({ createdAt: 'desc' } as const)

    const posts = await prisma.marketingPost.findMany({
      where,
      orderBy,
      take: maxRows,
      select: {
        id: true,
        channel: true,
        status: true,
        createdAt: true,
        scheduledFor: true,
      },
    })

    const metadataRows = buildMetadataRows({
      channel,
      status,
      from,
      to,
      sort,
      maxRows,
      totalRows: posts.length,
    })
    const header = ['postId', 'channel', 'status', 'createdAt', 'scheduledFor']
    const rows = posts.map((p) => [
      p.id,
      p.channel,
      p.status,
      p.createdAt.toISOString(),
      p.scheduledFor ? p.scheduledFor.toISOString() : '',
    ])
    const csv = [...metadataRows, [], header, ...rows]
      .map((row) => row.map((cell) => escapeCsv(cell)).join(','))
      .join('\n')

    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="marketing-history-filtered-${stamp}.csv"`,
      },
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Export social posts CSV error:', error)
    return NextResponse.json({ error: 'Failed to export social posts' }, { status: 500 })
  }
}
