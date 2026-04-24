import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { handleLicenseError, requireModuleAccess } from '@/lib/middleware/auth'

type FailureCategory =
  | 'auth_scope'
  | 'token_expired'
  | 'not_connected'
  | 'rate_limit'
  | 'validation_media'
  | 'provider_reject'
  | 'network_timeout'
  | 'worker_internal'
  | 'unknown'

function categorizeFailureReason(rawReason: string): FailureCategory {
  const reason = String(rawReason || '').toLowerCase()
  if (!reason) return 'unknown'
  if (reason.includes('not connected') || reason.includes('not configured')) return 'not_connected'
  if (reason.includes('expired') || reason.includes('token')) return 'token_expired'
  if (reason.includes('scope') || reason.includes('permission') || reason.includes('unauthor')) {
    return 'auth_scope'
  }
  if (reason.includes('rate limit') || reason.includes('too many requests') || reason.includes('429')) {
    return 'rate_limit'
  }
  if (
    reason.includes('image') ||
    reason.includes('video') ||
    reason.includes('media') ||
    reason.includes('invalid')
  ) {
    return 'validation_media'
  }
  if (
    reason.includes('timed out') ||
    reason.includes('timeout') ||
    reason.includes('econnreset') ||
    reason.includes('enotfound') ||
    reason.includes('network')
  ) {
    return 'network_timeout'
  }
  if (reason.includes('connector for channel') || reason.includes('not wired')) return 'worker_internal'
  if (reason.includes('rejected') || reason.includes('forbidden') || reason.includes('denied')) {
    return 'provider_reject'
  }
  return 'unknown'
}

function toFailureLabel(category: FailureCategory): string {
  switch (category) {
    case 'auth_scope':
      return 'Auth/scope issue'
    case 'token_expired':
      return 'Expired token'
    case 'not_connected':
      return 'Channel not connected'
    case 'rate_limit':
      return 'Rate limit'
    case 'validation_media':
      return 'Content/media validation'
    case 'provider_reject':
      return 'Provider rejected'
    case 'network_timeout':
      return 'Network/timeout'
    case 'worker_internal':
      return 'Worker/connector internal'
    default:
      return 'Unknown'
  }
}

/**
 * GET /api/social/posts/failure-analytics
 * Aggregates top failure categories and reasons over recent window.
 */
export async function GET(request: NextRequest) {
  try {
    const { tenantId } = await requireModuleAccess(request, 'marketing')
    const { searchParams } = new URL(request.url)
    const daysRaw = Number(searchParams.get('days') || 7)
    const channel = String(searchParams.get('channel') || '')
      .trim()
      .toUpperCase()
    const days = daysRaw === 30 ? 30 : 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    const where: Record<string, unknown> = {
      tenantId,
      status: 'FAILED',
      createdAt: { gte: since },
    }
    if (channel && channel !== 'ALL') where.channel = channel

    const rows = await prisma.marketingPost.findMany({
      where,
      select: { id: true, channel: true, createdAt: true, metadata: true },
      take: 1000,
      orderBy: { createdAt: 'desc' },
    })

    const countsByCategory = new Map<FailureCategory, number>()
    const countsByReason = new Map<string, number>()
    for (const row of rows) {
      const metadata = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {}
      const rawReason = String(metadata.error || 'Dispatch failed')
      const category = categorizeFailureReason(rawReason)
      countsByCategory.set(category, (countsByCategory.get(category) || 0) + 1)
      countsByReason.set(rawReason, (countsByReason.get(rawReason) || 0) + 1)
    }

    const topCategories = Array.from(countsByCategory.entries())
      .map(([category, count]) => ({
        category,
        label: toFailureLabel(category),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    const topReasons = Array.from(countsByReason.entries())
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6)

    return NextResponse.json({
      windowDays: days,
      totalFailed: rows.length,
      since: since.toISOString(),
      topCategories,
      topReasons,
    })
  } catch (error) {
    if (error && typeof error === 'object' && 'moduleId' in error) {
      return handleLicenseError(error)
    }
    console.error('Failure analytics error:', error)
    return NextResponse.json({ error: 'Failed to load failure analytics' }, { status: 500 })
  }
}

